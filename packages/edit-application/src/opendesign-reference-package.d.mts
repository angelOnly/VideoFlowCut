export interface ReferenceFile {
  sourcePath: string;
  deliveredPath: string;
  sourceSha256?: string;
  sha256?: string;
  localReadable?: boolean;
  requiredForRun?: boolean;
  uses: Array<{ kind: string; id: string; [key: string]: unknown }>;
}

export interface ReferenceScene {
  sceneId: string;
  status: "ready" | "pending" | "incomplete";
  diagnostics?: string[];
  visualRoles?: Array<{ assets: Array<{ assetId: string; sourceHash: string }> }>;
  visualPlan?: {
    status: "draft" | "previewed" | "pending";
    primaryRoles: string[];
    referenceMappings?: Array<{ referenceId: string; targetRole: string; treatment: string }>;
    graphicLed?: boolean;
    graphicReasons?: string[];
    preview?: { workId: string; startFrame: number; endFrame: number; definitionHash: string; definitionPath: string;
      author?: { project: string; run_id: string; frozen_version: string } };
  };
}

export interface ReferenceManifest {
  projectId: string;
  revision: number;
  projectSnapshot?: { path: string; sha256: string };
  selectedSceneIds?: string[];
  scenes?: ReferenceScene[];
  files: ReferenceFile[];
  diagnostics: Array<{ path?: string; reason: string; requiredForRun?: boolean }>;
  verificationErrors?: Array<{ path: string; reason: string }>;
  [key: string]: unknown;
}

export function prepareReferencePackage(input: Record<string, unknown>, outputRoot: string, libraryRoot?: string): Promise<ReferenceManifest>;
export function verifyReferenceDelivery(manifest: ReferenceManifest, listing: { files: Array<{ path: string; localPath?: string }> },
  revision: number, odProjectId: string, currentProject?: unknown): Promise<{ manifest: ReferenceManifest; prompt?: string }>;
