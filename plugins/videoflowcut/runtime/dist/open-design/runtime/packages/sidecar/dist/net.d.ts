/**
 * @module net
 *
 * Generic TCP server primitives shared by port allocation and the JSON-IPC
 * server: a promise-based close and a promise-based listen-on-port. Depends only
 * on `node:net`.
 */
import { type Server } from "node:net";
/**
 * @internal Close a listening server, resolving once closed (no-op if not
 * listening).
 */
export declare function closeServer(server: Server): Promise<void>;
/**
 * @internal Start an exclusive TCP server on the given port/host, resolving with
 * the listening server.
 */
export declare function listenOnPort(port: number, host: string): Promise<Server>;
//# sourceMappingURL=net.d.ts.map