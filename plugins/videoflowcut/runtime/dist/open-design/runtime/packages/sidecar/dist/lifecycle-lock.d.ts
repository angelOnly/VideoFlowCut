import { type SidecarStamp } from "./stamp.js";
export type SidecarLifecycleLockOptions = Readonly<{
    timeoutMs?: number;
}>;
/**
 * Serialize one Windows lifecycle resource set across independent clients.
 *
 * The named pipe is an ephemeral kernel lock, not a second resource identity:
 * callers still declare the exact five-field stamps they intend to coordinate.
 */
export declare function withSidecarLifecycleLock<T>(stampInputs: readonly SidecarStamp[], operation: () => Promise<T>, options?: SidecarLifecycleLockOptions): Promise<T>;
//# sourceMappingURL=lifecycle-lock.d.ts.map