import type { OpenDesignHostProjectImportResult, OpenDesignHostProjectReplaceWorkingDirResult, OpenDesignHostPickWorkingDirResult } from "./protocol.js";
/**
 * Converts a privileged host adapter's raw project-import result into the
 * host-owned renderer contract. The adapter may internally call daemon APIs,
 * but only project identifiers cross the host bridge.
 */
export declare function normalizeOpenDesignHostProjectImportResult(input: unknown): OpenDesignHostProjectImportResult;
/**
 * Converts a privileged host adapter's raw working-dir replace result into the
 * host-owned renderer contract.
 */
export declare function normalizeOpenDesignHostProjectReplaceWorkingDirResult(input: unknown): OpenDesignHostProjectReplaceWorkingDirResult;
/**
 * Converts a privileged host adapter's raw working-dir pick result into the
 * host-owned renderer contract (chosen path plus single-use token).
 */
export declare function normalizeOpenDesignHostPickWorkingDirResult(input: unknown): OpenDesignHostPickWorkingDirResult;
//# sourceMappingURL=normalize.d.ts.map