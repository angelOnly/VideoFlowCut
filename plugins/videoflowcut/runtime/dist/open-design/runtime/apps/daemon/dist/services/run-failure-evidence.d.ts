import type { RunEventForFailureClassification, RunFailureClassification, RunFailureClassificationInput } from '../run-failure-classification.js';
/** Add causal fields without changing legacy categories, actions or retries. */
export declare function runFailureEvidence(input: RunFailureClassificationInput, failure: RunFailureClassification, events: RunEventForFailureClassification[]): Partial<RunFailureClassification>;
