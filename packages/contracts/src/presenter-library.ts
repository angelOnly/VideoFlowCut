import { z } from "zod";
import type { MediaMetadata } from "./index.js";

export const LTX_AVATAR_WORKFLOW_ID = "videoflowcut-ltx23-avatar-v1";
export const presenterMediaKindSchema = z.enum(["photo", "voice"]);
export type PresenterMediaKind = z.infer<typeof presenterMediaKindSchema>;

export interface PresenterLibraryEntry {
  id: string;
  kind: PresenterMediaKind;
  name: string;
  fileName: string;
  contentHash: string;
  metadata: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}
export interface PresenterLibrary {
  entries: PresenterLibraryEntry[];
  defaults: { photoId?: string; voiceId?: string };
}
/** 项目保存当时采用的文件身份，后续改库不会改变已采用输入。 */
export interface PresenterSelection {
  photo?: { entryId: string; assetId: string; contentHash: string; name: string };
  voice?: { entryId: string; assetId: string; contentHash: string; name: string; voiceReferenceId: string };
}
export const presenterSelectionSchema = z.object({
  baseRevision: z.number().int().positive(),
  photoId: z.string().min(1).optional(),
  voiceId: z.string().min(1).optional()
}).strict();
