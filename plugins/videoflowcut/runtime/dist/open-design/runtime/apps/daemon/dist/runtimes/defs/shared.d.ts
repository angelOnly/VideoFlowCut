import { detectAcpModels } from '../../agent-protocol/index.js';
import { parsePiModels } from '../../agent-protocol/index.js';
import { execAgentFile } from '../invocation.js';
import { DEFAULT_MODEL_OPTION } from '../models.js';
import type { RuntimeModelOption } from '../types.js';
export { detectAcpModels, parsePiModels, execAgentFile, DEFAULT_MODEL_OPTION };
export declare function clampCodexReasoning(modelId: string | null | undefined, effort: string | null | undefined): string | null | undefined;
export declare function parseLineSeparatedModels(stdout: string): RuntimeModelOption[];
