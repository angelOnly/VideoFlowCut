import type Database from 'better-sqlite3';
import type { ChatArtifactRef } from './types.js';
export declare function chatArtifactSnapshotContentUrl(projectId: string, snapshotId: string): string;
export declare function chatArtifactSnapshotThumbnailUrl(projectId: string, snapshotId: string): string;
export declare function projectChatArtifactRefs(db: Database.Database, projectId: string, messageId: string): ChatArtifactRef[];
/**
 * One query per conversation instead of one per message. `listMessages` reads
 * whole conversations, so a per-row lookup would be a straight N+1.
 */
export declare function projectConversationChatArtifactRefs(db: Database.Database, projectId: string, conversationId: string): Map<string, ChatArtifactRef[]>;
