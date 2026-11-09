/** @module agent-protocol/dsh-profile/frames
 * Runtime validation for the versioned profile protocol. Validation messages
 * deliberately name fields but never include field values or raw frames.
 */
import { type DshProfileHostCommand, type DshProfileRuntimeFrame } from './types.js';
export declare function parseDshProfileRuntimeFrame(value: unknown): DshProfileRuntimeFrame;
export declare function parseDshProfileHostCommand(value: unknown): DshProfileHostCommand;
