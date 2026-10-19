export const LTX_AVATAR_WORKFLOW_ID: string;
export const LTX_DEFAULT_PROMPT: string;
export const LTX_NEGATIVE_PROMPT: string;
export function configureLtxAvatar(input: { workflowPath: string; outputDirectory: string }): Promise<{ workflowId: string; outputDirectory: string; positiveNodeId: string; negativeNodeId: string }>;
export function importConfiguredVoice(input: { workflowPath: string; inputRoot: string; serverUrl: string }): Promise<{ imported: boolean; reason?: string; voiceId?: string }>;
