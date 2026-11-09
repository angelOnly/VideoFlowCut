/** Derive Task object state from every physical Run, including late upload receipts. */
export declare function taskObjectMetadata(runs: Record<string, unknown>[]): {
    manifest_completeness: string;
    trace_object_summary: {
        new_file_count: number;
        modified_file_count: number;
        recovered_file_count: number;
        candidate_file_count: number;
        uploaded_file_count: number;
        skipped_file_count: number;
        skip_reasons: Record<string, number>;
    };
};
