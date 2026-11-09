/** Export inputs read from an actual composition, never from an Agent plan. */
export interface MotionExportSpec {
    sourcePath: string;
    videoPath: string;
    audio: 'required' | 'silent';
}
export declare function readMotionExportSpec(input: {
    projectRoot: string;
    sourcePath: string;
    outputPath: string;
}): Promise<MotionExportSpec | undefined>;
/** FFmpeg export evidence; it does not settle a Run or evaluate creative quality. */
export declare function assertMotionExport(videoFile: string, spec: MotionExportSpec): Promise<void>;
