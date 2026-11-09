/**
 * @module json-ipc
 *
 * Newline-delimited JSON IPC over a unix socket / Windows named pipe. Provides a
 * server that decodes one JSON frame per connection (UTF-8 safe across chunk
 * boundaries), runs a handler, and replies `{ok,result}`/`{ok:false,error}`, plus
 * a client request with timeout. Includes opt-in structured tracing (gated by
 * `OD_JSON_IPC_TRACE`) and stale-socket cleanup before binding. The trace
 * sequence counter is module-private singleton state. Depends on `node:fs`,
 * `node:net`, `node:path`, `node:string_decoder`, the shared net close helper,
 * the IPC-path recognizer, and the public IPC types.
 */
import type { JsonIpcHandler, JsonIpcServerHandle } from "./types.js";
/**
 * Start a newline-delimited JSON IPC server on a unix socket / named pipe: each
 * connection carries one JSON request, the handler's result is written back as
 * `{ok:true,result}` (or `{ok:false,error}` on parse/handler failure).
 * @returns A handle whose `close()` stops the server and unlinks the socket.
 */
export declare function createJsonIpcServer({ handler, socketPath, }: {
    handler: JsonIpcHandler;
    socketPath: string;
}): Promise<JsonIpcServerHandle>;
/**
 * Send one newline-delimited JSON request over a unix socket / named pipe and
 * resolve with the server's `result`, rejecting on error response or timeout.
 * @returns The server's `result` payload.
 */
export declare function requestJsonIpc<T = any>(socketPath: string, payload: unknown, { timeoutMs }?: {
    timeoutMs?: number;
}): Promise<T>;
//# sourceMappingURL=json-ipc.d.ts.map