/** 保持宿主连接，仅在已完成调用之间切换业务 MCP；任何未知结果都不自动重放。 */
export function createReloadingMcpSession({ resolveDeployment, connect, onToolsChanged = async () => {}, runExclusive = (action) => action() }) {
  let current;
  let targetProjectId;
  let exposed = new Map();
  let queue = Promise.resolve();
  let closed = false;
  let emptyCatalogExposed = false;
  const fingerprint = (tool) => JSON.stringify(tool);
  const serial = (action) => {
    const result = queue.then(() => {
      if (closed) throw new Error("MCP 连接管理层已关闭");
      return runExclusive(action);
    });
    queue = result.catch(() => {});
    return result;
  };
  const refresh = async () => {
    const deployment = await resolveDeployment();
    if (current?.releaseId === deployment.releaseId && current.runtimeId === deployment.runtimeId && current.isAlive()) return;
    // 先握手并核对新进程，再替换旧连接；失败时绝不把旧进程冒充新版。
    const next = await connect(deployment);
    try {
      if (targetProjectId) {
        const restored = await next.callTool({ name: "target_project", arguments: { project_id: targetProjectId } });
        if (restored.isError) throw new Error("新版 MCP 无法恢复原项目定位；请明确重新选择项目");
      }
      const previous = current;
      current = next;
      try { await previous?.close(); }
      finally {
        if (emptyCatalogExposed || (previous && JSON.stringify(previous.tools) !== JSON.stringify(next.tools))) await onToolsChanged();
        emptyCatalogExposed = false;
      }
    } catch (error) {
      if (current !== next) await next.close();
      throw error;
    }
  };
  return {
    refresh: () => serial(refresh),
    listTools: () => serial(async () => {
      try { await refresh(); } catch {
        // 工具目录仍可发现，实际执行继续受实时健康门禁约束；首次失败后恢复会通知宿主。
        if (!current) emptyCatalogExposed = true;
      }
      const tools = current?.tools ?? [];
      exposed = new Map(tools.map((tool) => [tool.name, fingerprint(tool)]));
      return { tools };
    }),
    callTool: (params, options) => serial(async () => {
      try { await refresh(); } catch (error) {
        return { isError: true, content: [{ type: "text", text: `MCP_RUNTIME_UNAVAILABLE：${error instanceof Error ? error.message : error}。本次未执行；连接保留，恢复后请重新读回状态。` }] };
      }
      // 排队期间宿主已取消的请求不能等到部署完成后再落地。
      if (options?.signal?.aborted) return { isError: true, content: [{ type: "text", text: "MCP_CALL_CANCELLED：请求已取消，本次未执行。" }] };
      const tool = current.tools.find((item) => item.name === params.name);
      if (!tool || exposed.get(params.name) !== fingerprint(tool)) {
        return { isError: true, content: [{ type: "text", text: "MCP_TOOL_SCHEMA_CHANGED：工具定义已更新；请刷新工具表并重新判断参数。本次未执行。" }] };
      }
      try {
        const result = await current.callTool(params, options);
        if (params.name === "target_project" && !result.isError) targetProjectId = params.arguments?.project_id;
        if (params.name === "create_project" && !result.isError) {
          // 创建项目也会改变业务进程的默认定位；仅保存返回的真实 ID，不重放创建。
          targetProjectId = undefined;
          const text = result.content?.find((item) => item.type === "text")?.text;
          try { targetProjectId = JSON.parse(text).snapshot?.project?.id; } catch { /* 无法解析时要求显式定位。 */ }
        }
        return result;
      } catch (error) {
        // 断连可能发生在写入之后；只返回未知结果，不重试当前操作。
        return { isError: true, content: [{ type: "text", text: `MCP_CALL_OUTCOME_UNKNOWN：${error instanceof Error ? error.message : error}。未自动重放；请先读取 Job、Revision 和对象核对副作用。` }] };
      }
    }),
    close: async () => {
      closed = true;
      await queue;
      await current?.close();
    }
  };
}
