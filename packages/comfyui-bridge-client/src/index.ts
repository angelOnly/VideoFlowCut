import { openAsBlob } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename } from "node:path";

export interface BridgeWorkflowField {
  id: string;
  label: string;
  kind: string;
  required: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
}

export interface BridgeItemSlot {
  id: string;
  label: string;
  kind: "audio" | "video" | "image" | string;
  required: boolean;
}

export interface BridgeOutputSlot {
  id: string;
  label: string;
  kind: string;
}

export interface BridgeWorkflow {
  id: string;
  name: string;
  available: boolean;
  reason?: string | null;
  schemaVersion: string;
  fields: BridgeWorkflowField[];
  itemSlots: BridgeItemSlot[];
  outputs: BridgeOutputSlot[];
}

export interface BridgeOutput {
  outputSlotId: string;
  displayName: string;
  kind: "video" | "image" | "audio" | "file" | "text" | string;
  fileName?: string;
  mime?: string;
  outputId?: string;
  downloadUrl?: string;
  text?: string;
}

export interface BridgeRun {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error?: string | null;
  outputs: BridgeOutput[];
}

export interface BridgeRunRequest {
  fieldValues: Record<string, unknown>;
  files?: Array<{ slot: BridgeItemSlot; path: string; mime?: string }>;
}

export interface BridgeRunSubmission {
  workflow: BridgeWorkflow;
  run: BridgeRun;
  request: BridgeRunRequest;
  schemaRetryCount: number;
}

export class BridgeError extends Error {
  constructor(message: string, public readonly status?: number, public readonly body?: unknown, public readonly code = "BRIDGE_HTTP_ERROR") {
    super(message);
    this.name = "BridgeError";
  }
}

export class WorkflowUnavailableError extends BridgeError {
  constructor(message: string, status?: number, body?: unknown) {
    super(message, status, body, "WORKFLOW_UNAVAILABLE");
    this.name = "WorkflowUnavailableError";
  }
}

/** ComfyUI 重启后旧 run_id 可能不存在；调用方可据此提示重新提交，而不是误报普通网络错误。 */
export class BridgeRunLostError extends BridgeError {
  constructor(public readonly runId: string, body?: unknown) {
    super(`Bridge Run 已不可查询：${runId}。ComfyUI 可能已重启；本地 Job 保留了请求摘要，可据此重新提交。`, 404, body, "BRIDGE_RUN_LOST");
    this.name = "BridgeRunLostError";
  }
}

const ensureNoTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * Bridge 返回的 downloadUrl 相对于 ComfyUI 服务根地址，而不是 API 根路径。
 * 因此即使调用方把 Bridge API 配在带前缀的反向代理路径下，下载也不能重复拼接该前缀。
 */
function serverOriginFromApiBase(apiBaseUrl: string): string {
  try {
    const parsed = new URL(apiBaseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("unsupported protocol");
    return parsed.origin;
  } catch {
    throw new BridgeError("COMFYUI_BRIDGE_URL 必须是完整的 HTTP(S) 地址", undefined, apiBaseUrl, "BRIDGE_API_URL_INVALID");
  }
}

/** Bridge 合同只允许服务根相对路径；拒绝被输出元数据引导到其他主机。 */
function resolveSameOriginDownloadUrl(downloadUrl: string, serverBaseUrl: string): string {
  if (!downloadUrl.startsWith("/") || downloadUrl.startsWith("//")) {
    throw new BridgeError("Bridge 输出的 downloadUrl 必须是以单个 / 开头的同源路径", undefined, downloadUrl, "UNSAFE_OUTPUT_DOWNLOAD_URL");
  }
  try {
    const resolved = new URL(downloadUrl, serverBaseUrl);
    if (resolved.origin !== serverBaseUrl) {
      throw new BridgeError("Bridge 输出的 downloadUrl 指向了其他服务", undefined, downloadUrl, "UNSAFE_OUTPUT_DOWNLOAD_URL");
    }
    return resolved.toString();
  } catch (error) {
    if (error instanceof BridgeError) throw error;
    throw new BridgeError("Bridge 输出的 downloadUrl 无法解析为同源路径", undefined, downloadUrl, "UNSAFE_OUTPUT_DOWNLOAD_URL");
  }
}

/**
 * 所有外部工作流共享这个客户端。每次提交都重新读取 Workflow 详情，
 * 因此不会把 schemaVersion、field ID 或 itemSlot ID 写死为长期合同。
 */
export class ComfyUIBridgeClient {
  readonly apiBaseUrl: string;
  readonly serverBaseUrl: string;

  constructor(apiBaseUrl = process.env.COMFYUI_BRIDGE_URL ?? "http://127.0.0.1:8188/comfyui-bridge/v1") {
    this.apiBaseUrl = ensureNoTrailingSlash(apiBaseUrl);
    this.serverBaseUrl = serverOriginFromApiBase(this.apiBaseUrl);
  }

  async health(): Promise<{ status: string; protocolVersion?: number; workflowCount?: number }> {
    return this.requestJson("/health");
  }

  async listWorkflows(): Promise<{ workflows: BridgeWorkflow[] }> {
    return this.requestJson("/workflows");
  }

  async getWorkflow(workflowId: string): Promise<BridgeWorkflow> {
    const workflow = await this.requestJson<BridgeWorkflow>(`/workflows/${encodeURIComponent(workflowId)}`);
    if (!workflow.available) {
      throw new WorkflowUnavailableError(`工作流不可用：${workflow.reason ?? workflow.name}`, 409, workflow);
    }
    return workflow;
  }

  async getRun(runId: string): Promise<BridgeRun> {
    try {
      return await this.requestJson<BridgeRun>(`/runs/${encodeURIComponent(runId)}`);
    } catch (error) {
      if (error instanceof BridgeError && error.status === 404) throw new BridgeRunLostError(runId, error.body);
      throw error;
    }
  }

  async createRun(input: BridgeRunRequest & { workflow: BridgeWorkflow }): Promise<BridgeRun> {
    const path = `/workflows/${encodeURIComponent(input.workflow.id)}/runs`;
    const request = { schemaVersion: input.workflow.schemaVersion, fieldValues: input.fieldValues };
    if (!input.files?.length) {
      return this.requestJson<BridgeRun>(path, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(request)
      });
    }
    const form = new FormData();
    form.set("request", JSON.stringify(request));
    for (const file of input.files) {
      // openAsBlob 让 Undici 从磁盘按需读取 multipart 内容，避免把长视频/音频完整复制到 Node 堆。
      const blob = await openAsBlob(file.path, { type: file.mime ?? "application/octet-stream" });
      form.set(`file_${file.slot.id}`, blob, basename(file.path));
    }
    return this.requestJson<BridgeRun>(path, { method: "POST", body: form });
  }

  async createRunWithSchemaRetry(
    workflowId: string,
    buildRequest: (workflow: BridgeWorkflow) => Promise<BridgeRunRequest>
  ): Promise<BridgeRunSubmission> {
    let workflow = await this.getWorkflow(workflowId);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const request = await buildRequest(workflow);
        const run = await this.createRun({ workflow, ...request });
        return { workflow, run, request, schemaRetryCount: attempt };
      } catch (error) {
        if (!(error instanceof BridgeError) || error.status !== 409 || attempt === 1) throw error;
        workflow = await this.getWorkflow(workflowId);
      }
    }
    throw new BridgeError("无法创建 Bridge 任务");
  }

  async waitForRun(runId: string, options?: { timeoutMs?: number; intervalMs?: number; onUpdate?: (run: BridgeRun) => void }): Promise<BridgeRun> {
    const timeoutMs = options?.timeoutMs ?? 30 * 60_000;
    const intervalMs = options?.intervalMs ?? 2_000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const run = await this.getRun(runId);
      options?.onUpdate?.(run);
      if (run.status === "succeeded") return run;
      if (run.status === "failed") throw new BridgeError(`Bridge 任务失败：${run.error ?? "未知错误"}`, undefined, run, "BRIDGE_RUN_FAILED");
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new BridgeError(`等待 Bridge 任务超时：${runId}`, undefined, undefined, "BRIDGE_RUN_TIMEOUT");
  }

  async downloadOutput(output: BridgeOutput, targetPath: string): Promise<void> {
    if (!output.downloadUrl) throw new BridgeError("输出缺少 downloadUrl", undefined, output, "MISSING_DOWNLOAD_URL");
    const url = resolveSameOriginDownloadUrl(output.downloadUrl, this.serverBaseUrl);
    // 输出端点不应将本地 Worker 重定向到其他网络位置。
    const response = await fetch(url, { redirect: "error" });
    if (!response.ok) throw new BridgeError(`下载输出失败：HTTP ${response.status}`, response.status, undefined, "OUTPUT_DOWNLOAD_FAILED");
    await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
  }

  findRequiredSlot(workflow: BridgeWorkflow, kind: BridgeItemSlot["kind"], labelIncludes?: string): BridgeItemSlot {
    const matching = workflow.itemSlots.filter((slot) => slot.kind === kind && (!labelIncludes || slot.label.toLowerCase().includes(labelIncludes.toLowerCase())));
    const slot = matching.find((candidate) => candidate.required) ?? matching[0];
    if (!slot) throw new BridgeError(`工作流 ${workflow.name} 没有可用的 ${kind} 输入槽位`);
    return slot;
  }

  findTextField(workflow: BridgeWorkflow): BridgeWorkflowField {
    const field = workflow.fields.find((candidate) => candidate.kind === "text" || candidate.label.toLowerCase().includes("text"));
    if (!field) throw new BridgeError(`工作流 ${workflow.name} 没有可用的文本字段`);
    return field;
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, init);
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);
    if (!response.ok) {
      const detail = typeof body === "object" && body && "error" in body ? String((body as { error?: unknown }).error) : undefined;
      throw new BridgeError(`Bridge 请求失败：HTTP ${response.status}${detail ? `，${detail}` : ""}`, response.status, body, "BRIDGE_HTTP_ERROR");
    }
    return body as T;
  }
}

export const FUNASR_WORKFLOW_ID = "dd564543-d02d-4247-9e97-089417db9e7a";
export const OMNIVOICE_WORKFLOW_ID = "ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce";
