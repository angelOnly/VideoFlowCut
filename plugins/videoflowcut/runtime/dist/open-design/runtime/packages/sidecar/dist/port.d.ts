/**
 * @module port
 *
 * TCP port allocation: a forced port is checked for availability and reserved, or
 * a dynamic port is probed via an ephemeral listen until a non-reserved one is
 * found. Depends on the shared net primitives and the public port types.
 */
import type { PortAllocation, PortRequest } from "./types.js";
/**
 * Allocate a port: a forced port when one is supplied, otherwise a dynamic one,
 * recording it in the `reserved` set to avoid double-allocation.
 * @returns The port allocation (port + how it was chosen).
 */
export declare function allocatePort({ host, label, port, reserved, }?: PortRequest): Promise<PortAllocation>;
//# sourceMappingURL=port.d.ts.map