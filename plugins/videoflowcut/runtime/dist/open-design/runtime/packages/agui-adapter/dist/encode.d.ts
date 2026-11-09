import type { GenUISurfaceEvent, PluginPipelineStageEvent } from '@open-design/contracts';
import type { AGUIEvent } from './types.js';
export interface OdMessageChunkEvent {
    kind: 'message_chunk';
    runId?: string;
    text?: string;
    done?: boolean;
    ts?: number;
}
export interface OdToolCallEvent {
    kind: 'tool_call';
    runId?: string;
    toolName?: string;
    args?: unknown;
    callId?: string;
    status?: 'started' | 'completed' | 'failed';
    result?: unknown;
    ts?: number;
}
export interface OdStateUpdateEvent {
    kind: 'state_update';
    runId?: string;
    path?: string;
    value?: unknown;
    ts?: number;
}
export interface OdRunEndEvent {
    kind: 'end';
    runId?: string;
    status?: 'succeeded' | 'failed' | 'canceled' | 'completed';
    ts?: number;
}
export interface OdRunStartedEvent {
    kind: 'run_started';
    runId?: string;
    ts?: number;
}
export type OdNativeEvent = GenUISurfaceEvent | PluginPipelineStageEvent | OdMessageChunkEvent | OdToolCallEvent | OdStateUpdateEvent | OdRunEndEvent | OdRunStartedEvent;
export interface EncodeContext {
    runId: string;
    seq?: number;
    now?: number;
}
export declare function encodeOdEventForAgui(event: OdNativeEvent, ctx: EncodeContext): AGUIEvent | null;
//# sourceMappingURL=encode.d.ts.map