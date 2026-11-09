// src/encode.ts
function encodeOdEventForAgui(event, ctx) {
  const ts = ctx.now ?? Date.now();
  const base = { runId: ctx.runId, ts, ...ctx.seq !== void 0 ? { seq: ctx.seq } : {} };
  switch (event.kind) {
    case "message_chunk": {
      const out = {
        ...base,
        kind: "agent.message",
        text: event.text ?? ""
      };
      if (event.done) out.done = true;
      return out;
    }
    case "tool_call": {
      const out = {
        ...base,
        kind: "tool_call",
        toolName: event.toolName ?? "unknown",
        args: event.args ?? null
      };
      if (event.callId) out.callId = event.callId;
      if (event.status) out.status = event.status;
      if (event.result !== void 0) out.result = event.result;
      return out;
    }
    case "state_update": {
      const out = {
        ...base,
        kind: "state_update",
        path: event.path ?? "",
        value: event.value ?? null
      };
      return out;
    }
    case "run_started": {
      const out = { ...base, kind: "run.lifecycle", status: "started" };
      return out;
    }
    case "end": {
      const status = event.status === "failed" ? "failed" : event.status === "canceled" ? "cancelled" : "completed";
      const out = { ...base, kind: "run.lifecycle", status };
      return out;
    }
    case "pipeline_stage_started": {
      const out = {
        ...base,
        kind: "run.lifecycle",
        status: "pipeline_stage_started",
        stageId: event.stageId,
        iteration: event.iteration
      };
      return out;
    }
    case "pipeline_stage_completed": {
      const out = {
        ...base,
        kind: "run.lifecycle",
        status: "pipeline_stage_completed",
        stageId: event.stageId,
        iteration: event.iteration
      };
      return out;
    }
    case "genui_surface_request": {
      const out = {
        ...base,
        kind: "ui.surface_requested",
        surfaceId: event.surfaceId,
        surfaceKind: surfaceKindFromPayload(event.payload) ?? "confirmation",
        payload: event.payload
      };
      return out;
    }
    case "genui_surface_response": {
      const out = {
        ...base,
        kind: "ui.surface_responded",
        surfaceId: event.surfaceId,
        value: event.value,
        respondedBy: event.respondedBy
      };
      return out;
    }
    case "genui_surface_timeout": {
      const out = {
        ...base,
        kind: "ui.surface_responded",
        surfaceId: event.surfaceId,
        value: { resolution: event.resolution },
        respondedBy: "auto"
      };
      return out;
    }
    case "genui_state_synced": {
      const out = {
        ...base,
        kind: "state_update",
        path: `genui.${event.surfaceId}`,
        value: { persistTier: event.persistTier }
      };
      return out;
    }
    default:
      return null;
  }
}
function surfaceKindFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const k = payload.kind;
  if (k === "form" || k === "choice" || k === "confirmation" || k === "oauth-prompt") {
    return k;
  }
  return null;
}
export {
  encodeOdEventForAgui
};
