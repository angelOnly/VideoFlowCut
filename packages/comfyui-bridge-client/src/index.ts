import { randomUUID } from "node:crypto";
import { openAsBlob } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, toNamespacedPath } from "node:path";
import { readRuntimeConfig } from "@videocut/project-overview";

export interface BridgeWorkflowField {
  id: string;
  label: string;
  kind: string;
  required: boolean;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
}

export interface BridgeItemSlot {
  id: string;
  label: string;
  mediaKind: string;
  min: number;
  max: number;
}

export interface BridgeOutputSlot {
  id: string;
  label: string;
  mediaKinds: string[];
  min: number;
  max: number;
}

export interface BridgeWorkflow {
  id: string;
  name: string;
  schemaVersion: string;
  fields: BridgeWorkflowField[];
  itemSlots: BridgeItemSlot[];
  outputs: BridgeOutputSlot[];
}

export interface BridgeOutput {
  kind: string;
  fileName?: string;
  mime?: string;
  outputId?: string;
  text?: string;
  value?: unknown;
}

export interface BridgeHealth {
  status: string;
  protocolVersion?: number;
  workflowCount?: number;
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

/**
 * 网络层在尚未拿到 HTTP 响应时会把原因压缩为 fetch failed。单独建模后，
 * Job 才能把“Bridge 未就绪”与已提交 Run 的未知结果、工作流 409 区分开。
 */
export class BridgeUnavailableError extends BridgeError {
  constructor(public readonly endpoint: string, public readonly reason: string, message?: string) {
    super(
      message ?? `无法连接 ComfyUI Bridge（${endpoint}）：${reason}。请确认服务已启动，并检查 /health 是否返回 200。`,
      undefined,
      undefined,
      "BRIDGE_UNAVAILABLE"
    );
    this.name = "BridgeUnavailableError";
  }
}

/** ComfyUI 重启后旧 run_id 可能不存在；调用方可据此提示重新提交，而不是误报普通网络错误。 */
export class BridgeRunLostError extends BridgeError {
  constructor(public readonly runId: string, body?: unknown) {
    super(`Bridge Run 已不可查询：${runId}。ComfyUI 可能已重启或 history 已清理；不能据 404 判断先前请求未执行，请先对账。`, 404, body, "BRIDGE_RUN_LOST");
    this.name = "BridgeRunLostError";
  }
}

const ensureNoTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const DEFAULT_BRIDGE_READINESS_TIMEOUT_MS = 120_000;
const DEFAULT_BRIDGE_READINESS_POLL_INTERVAL_MS = 2_000;

export interface ComfyUIBridgeClientOptions {
  /** 仅在无副作用的 Workflow 读取遇到网络未就绪时使用，绝不重放 Run 创建请求。 */
  readinessTimeoutMs?: number;
  readinessPollIntervalMs?: number;
}

function endpointForDiagnostics(endpoint: string): string {
  const parsed = new URL(endpoint);
  // 配置 URL 可能带查询串或凭据；诊断只需要服务和路径，不能把它们写入 Job 错误。
  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
}

function transportFailureReason(error: unknown): string {
  // fetch failed 会隐藏服务未启动的原因；只提取已知错误码，不输出 cause 中的凭据或请求。
  const cause = error instanceof Error ? error.cause : undefined;
  if (cause && typeof cause === "object" && "code" in cause) {
    if (cause.code === "ECONNREFUSED") return "ECONNREFUSED：连接被拒绝，请检查目标端口是否有 ComfyUI 服务监听";
    if (cause.code === "ENOTFOUND") return "ENOTFOUND：无法解析 ComfyUI 服务主机名，请检查 Bridge 地址";
    if (cause.code === "ETIMEDOUT" || cause.code === "UND_ERR_CONNECT_TIMEOUT") return "连接 ComfyUI 服务超时，请检查服务和网络";
  }
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

function isTransportFailure(error: unknown): boolean {
  return error instanceof TypeError
    || (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"));
}

const sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function serverOriginFromApiBase(apiBaseUrl: string): string {
  try {
    const parsed = new URL(apiBaseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("unsupported protocol");
    return parsed.origin;
  } catch {
    throw new BridgeError("COMFYUI_BRIDGE_URL 必须是完整的 HTTP(S) 地址", undefined, apiBaseUrl, "BRIDGE_API_URL_INVALID");
  }
}

/**
 * 所有外部工作流共享这个客户端。每次提交都重新读取 Workflow 详情，
 * 因此不会把 schemaVersion、field ID 或 itemSlot ID 写死为长期合同。
 */
export class ComfyUIBridgeClient {
  readonly apiBaseUrl: string;
  readonly serverBaseUrl: string;
  private readonly readinessTimeoutMs: number;
  private readonly readinessPollIntervalMs: number;

  constructor(apiBaseUrl = readRuntimeConfig().bridge.apiBaseUrl, options: ComfyUIBridgeClientOptions = {}) {
    this.apiBaseUrl = ensureNoTrailingSlash(apiBaseUrl);
    this.serverBaseUrl = serverOriginFromApiBase(this.apiBaseUrl);
    if (new URL(this.apiBaseUrl).pathname.endsWith("/comfyui-bridge/v1")) {
      throw new BridgeError("当前配置仍指向 Bridge v1，请改为 v2 后重新提交；已有任务先按原运行记录对账。", undefined, undefined, "BRIDGE_V1_UNSUPPORTED");
    }
    this.readinessTimeoutMs = Math.max(0, options.readinessTimeoutMs ?? DEFAULT_BRIDGE_READINESS_TIMEOUT_MS);
    this.readinessPollIntervalMs = Math.max(1, options.readinessPollIntervalMs ?? DEFAULT_BRIDGE_READINESS_POLL_INTERVAL_MS);
  }

  async health(): Promise<BridgeHealth> {
    return this.requestJson<BridgeHealth>("/health");
  }

  async listWorkflows(): Promise<{ workflows: Array<{ id: string; name: string; available: boolean; reason?: string | null; schemaVersion: string }> }> {
    return this.requestJson("/workflows");
  }

  async getWorkflow(workflowId: string): Promise<BridgeWorkflow> {
    const path = `/workflows/${encodeURIComponent(workflowId)}`;
    let workflow: BridgeWorkflow;
    try {
      workflow = await this.requestJson<BridgeWorkflow>(path);
    } catch (error) {
      // 读取 Schema 不会产生 Provider 副作用；因此 Bridge 刚重启时可以等待其健康，
      // 但 createRun 网络失败一律原样抛出，避免误以为未提交而重复生成。
      if (!(error instanceof BridgeUnavailableError)) throw error;
      await this.waitForBridgeReadiness(error);
      workflow = await this.requestJson<BridgeWorkflow>(path);
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

  async createRun(input: BridgeRunRequest & { workflow: BridgeWorkflow; runId: string }): Promise<BridgeRun> {
    const path = `/workflows/${encodeURIComponent(input.workflow.id)}/runs`;
    const request = { schemaVersion: input.workflow.schemaVersion, fieldValues: input.fieldValues };
    const form = new FormData();
    form.set("request", JSON.stringify(request));
    for (const file of input.files ?? []) {
      // 流式读取素材，避免长媒体完整载入 Node 堆。
      let blob: Blob;
      try { blob = await openAsBlob(toNamespacedPath(file.path), { type: file.mime ?? "application/octet-stream" }); }
      catch (error) { throw new BridgeError(`上传前无法读取本地文件：${error instanceof Error ? error.message : String(error)}`, undefined, undefined, "BRIDGE_INPUT_UNREADABLE"); }
      form.set(`file_${file.slot.id}`, blob, basename(file.path));
    }
    const run = await this.requestJson<BridgeRun>(path, { method: "POST", headers: { "x-comfyui-bridge-run-id": input.runId }, body: form });
    if (run.id !== input.runId) throw new BridgeError("Bridge 返回的 Run ID 与提交不一致", undefined, run, "BRIDGE_RUN_ID_MISMATCH");
    return run;
  }

  async createRunWithWorkflow(
    workflowId: string,
    buildRequest: (workflow: BridgeWorkflow) => Promise<BridgeRunRequest>,
    options?: { beforeSubmit?: (submission: BridgeRunSubmission) => void | Promise<void> }
  ): Promise<BridgeRunSubmission> {
    const workflow = await this.getWorkflow(workflowId);
    const request = await buildRequest(workflow);
    const runId = randomUUID();
    const pending: BridgeRunSubmission = { workflow, request, run: { id: runId, status: "queued", outputs: [] }, schemaRetryCount: 0 };
    // 客户端 ID 在发送前保存，连接中断时只能查询原 ID，不能换 ID 重放。
    await options?.beforeSubmit?.(pending);
    const run = await this.createRun({ workflow, ...request, runId });
    return { ...pending, run };
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
      if (String(run.status) === "canceled" || String(run.status) === "cancelled") throw new BridgeError("Bridge 任务已取消", undefined, run, "BRIDGE_RUN_CANCELLED");
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new BridgeError(`等待 Bridge 任务超时：${runId}`, undefined, undefined, "BRIDGE_RUN_TIMEOUT");
  }

  async downloadOutput(runId: string, output: BridgeOutput, targetPath: string): Promise<void> {
    if (!output.outputId) throw new BridgeError("输出缺少 outputId", undefined, output, "MISSING_OUTPUT_ID");
    const url = `${this.apiBaseUrl}/runs/${encodeURIComponent(runId)}/outputs/${encodeURIComponent(output.outputId)}`;
    let response: Response;
    try { response = await fetch(url, { redirect: "error" }); }
    catch (error) {
      if (isTransportFailure(error)) throw this.unavailableError(url, error);
      throw error;
    }
    if (!response.ok) throw new BridgeError(`下载输出失败：HTTP ${response.status}`, response.status, undefined, "OUTPUT_DOWNLOAD_FAILED");
    await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
  }

  findRequiredSlot(workflow: BridgeWorkflow, kind: string, labelIncludes?: string): BridgeItemSlot {
    const matching = workflow.itemSlots.filter((slot) => slot.mediaKind === kind && (!labelIncludes || slot.label.toLowerCase().includes(labelIncludes.toLowerCase())));
    const slot = matching.find((candidate) => candidate.min > 0) ?? matching[0];
    if (!slot) throw new BridgeError(`工作流 ${workflow.name} 没有可用的 ${kind} 输入槽位`);
    return slot;
  }

  findTextField(workflow: BridgeWorkflow): BridgeWorkflowField {
    const field = workflow.fields.find((candidate) => candidate.kind === "text" || candidate.label.toLowerCase().includes("text"));
    if (!field) throw new BridgeError(`工作流 ${workflow.name} 没有可用的文本字段`);
    return field;
  }

  private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const endpoint = `${this.apiBaseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(endpoint, init);
    } catch (error) {
      if (isTransportFailure(error)) throw this.unavailableError(endpoint, error);
      throw error;
    }
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);
    if (!response.ok) {
      const detail = typeof body === "object" && body && "error" in body ? String((body as { error?: unknown }).error) : undefined;
      throw new BridgeError(`Bridge 请求失败：HTTP ${response.status}${detail ? `，${detail}` : ""}`, response.status, body, "BRIDGE_HTTP_ERROR");
    }
    return body as T;
  }

  private unavailableError(endpoint: string, error: unknown): BridgeUnavailableError {
    return new BridgeUnavailableError(endpointForDiagnostics(endpoint), transportFailureReason(error));
  }

  private async waitForBridgeReadiness(initialError: BridgeUnavailableError): Promise<void> {
    if (this.readinessTimeoutMs === 0) throw initialError;
    const deadline = Date.now() + this.readinessTimeoutMs;
    let latestError = initialError;
    while (Date.now() < deadline) {
      await sleep(Math.min(this.readinessPollIntervalMs, Math.max(1, deadline - Date.now())));
      try {
        await this.health();
        return;
      } catch (error) {
        if (!(error instanceof BridgeUnavailableError)) throw error;
        latestError = error;
      }
    }
    throw new BridgeUnavailableError(
      latestError.endpoint,
      latestError.reason,
      `ComfyUI Bridge 在 ${Math.ceil(this.readinessTimeoutMs / 1_000)} 秒内仍未就绪（${latestError.endpoint}）：${latestError.reason}。请确认服务已启动，并检查 /health。`
    );
  }
}

export const FUNASR_WORKFLOW_ID = "dd564543-d02d-4247-9e97-089417db9e7a";
/**
 * 正式原声字幕工作流：返回 Provider 已分好的字幕段及其同源时间证据。
 * 正常 VideoFlowCut 路径只消费 segment 的 displayText/startMs/endMs。
 */
export const FUNASR_SOURCE_CAPTION_WORKFLOW_ID = "funasr-source-caption-v4";
export const OMNIVOICE_WORKFLOW_ID = "ba6238d0-3ee4-41d5-a1f4-a2aefc3933ce";
