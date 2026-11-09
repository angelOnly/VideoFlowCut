import { type MediaExecutionPolicy, type MediaPolicyDenial, type MediaPolicyTarget } from '@open-design/contracts';
export declare function defaultMediaExecutionPolicy(): MediaExecutionPolicy;
export declare function normalizeMediaExecutionPolicyForRun(value: unknown): MediaExecutionPolicy;
export declare function parseMediaExecutionPolicyInput(value: unknown): {
    ok: true;
    policy: MediaExecutionPolicy;
} | {
    ok: false;
    message: string;
};
export declare function mediaPolicyDenial(policy: MediaExecutionPolicy, target: MediaPolicyTarget): MediaPolicyDenial | null;
