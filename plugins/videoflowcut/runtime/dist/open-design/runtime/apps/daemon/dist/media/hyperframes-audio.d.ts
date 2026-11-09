export interface HyperFramesAudioTrack {
    file: string;
    format: string;
    start: number;
    duration: number;
    volume: number;
}
/** Resolve authored audio before frame capture; FFmpeg owns the audio clock. */
export declare function prepareHyperFramesAudio(html: string, compositionDir: string): Promise<{
    html: string;
    tracks: HyperFramesAudioTrack[];
}>;
export declare function hyperFramesAudioEncodingArgs(tracks: HyperFramesAudioTrack[], duration: number): string[];
