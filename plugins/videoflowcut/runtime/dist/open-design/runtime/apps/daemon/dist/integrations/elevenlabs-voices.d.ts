export interface ElevenLabsVoiceOption {
    voiceId: string;
    name: string;
    category?: string;
    labels?: Record<string, string>;
    previewUrl?: string;
}
export declare function listElevenLabsVoiceOptions(projectRoot: string, options?: {
    limit?: number;
    requestInit?: Pick<RequestInit, 'dispatcher'>;
}): Promise<ElevenLabsVoiceOption[]>;
