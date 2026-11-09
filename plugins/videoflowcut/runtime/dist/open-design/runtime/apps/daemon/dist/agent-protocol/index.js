/** @module agent-protocol
 * ACP, pi RPC, and DeepSeek Harness profile subprocess protocol adapters.
 * External daemon code imports only from this barrel.
 */
export { createJsonLineStream } from './core/index.js';
export { buildAcpSessionNewParams, normalizeModels, detectAcpModels, attachAcpSession, } from './acp/index.js';
export { mapPiRpcEvent, attachPiRpcSession, parsePiModels } from './pi-rpc/index.js';
export * from './dsh-profile/index.js';
//# sourceMappingURL=index.js.map