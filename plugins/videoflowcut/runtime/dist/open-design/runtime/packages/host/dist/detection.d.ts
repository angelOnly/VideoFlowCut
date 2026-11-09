import { type OpenDesignHostBridge, type OpenDesignHostClientType, type OpenDesignHostGlobalScope } from "./protocol.js";
/**
 * Structural type guard for a fully-formed {@link OpenDesignHostBridge}: checks
 * version, client type, and the presence of every required capability method.
 */
export declare function isOpenDesignHostBridge(value: unknown): value is OpenDesignHostBridge;
/**
 * Resolve the validated host bridge from `scope`, or `null` when absent or
 * malformed.
 */
export declare function getOpenDesignHost(scope?: OpenDesignHostGlobalScope): OpenDesignHostBridge | null;
/** True when a valid OpenDesign host bridge is present on `scope`. */
export declare function isOpenDesignHostAvailable(scope?: OpenDesignHostGlobalScope): boolean;
/** Detect the host client type on `scope`, falling back to web. */
export declare function detectOpenDesignHostClientType(scope?: OpenDesignHostGlobalScope): OpenDesignHostClientType | "web";
//# sourceMappingURL=detection.d.ts.map