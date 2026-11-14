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
  references?: Array<{ kind: "creative" | "motion"; id: string; sourceSha256: string; startMs: number; endMs: number }>;
  resourceIds?: string[];
  visualRoles?: Array<{ role: string; assets: Array<{ assetId: string; sourceHash: string; sourceRanges: Array<{ startMs: number; endMs: number }> }> }>;
  visualPlan?: {
    primaryRoles: string[];
    referenceMappings?: Array<{ referenceId: string; referenceKind?: "creative" | "motion"; researchDecisionId: string; startMs: number; endMs: number; targetRole: string; treatment: string; preserveRelation?: string; targetRange?: { startFrame: number; endFrame: number } }>;
    graphicLed?: boolean;
    graphicReasons?: string[];
  };
}

export function scopeReferenceManifest(manifest: ReferenceManifest, sceneIds: string[]): ReferenceManifest;

export interface ReferenceManifest {
  projectId: string;
  revision: number;
  packageRoot?: string;
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
