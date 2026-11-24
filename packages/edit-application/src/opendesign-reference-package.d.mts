export interface ReferenceFile {
  sourcePath: string;
  deliveredPath: string;
  sourceSha256?: string;
  sha256?: string;
  localReadable?: boolean;
  localDecode?: "verified";
  mimeType?: string;
  requiredForRun?: boolean;
  uses: Array<{ kind: string; id: string; [key: string]: unknown }>;
}

export interface ReferenceScene {
  sceneId: string;
  status: "ready" | "pending" | "incomplete";
  diagnostics?: string[];
  references?: Array<{ kind: "creative" | "motion"; id: string; sourceSha256: string; startMs: number; endMs: number; purpose?: string; video?: string }>;
  resourceIds?: string[];
  visualRoles?: Array<{ role: string; referenceFunction: string; usage: string;
    assets: Array<{ assetId: string; deliveredPath: string; sourceHash: string; sourceRanges: Array<{ startMs: number; endMs: number }> }> }>;
  visualPlan?: {
    primaryRoles?: string[];
    units?: Array<{ id: string; title: string; startFrame: number; endFrame: number; creativeDecisionId?: string;
      mode: import("../../contracts/src/production-unit-handoff.js").ProductionUnitMode;
      creativeDraftId?: string; handoffReceiptId?: string; restage?: { resourceId: string; sourceMs?: number; projectFrame: number } }>;
    researchLayers?: Array<{ level: "overallVisual" | "sceneComposition" | "motionMechanisms"; researchDecisionId: string; designExcerpt: string }>;
    referenceMappings?: Array<{ unitId?: string; use?: "primary" | "support"; referenceId?: string; referenceKind?: "creative" | "motion"; researchDecisionId?: string; startMs?: number; endMs?: number; targetRole?: string; treatment?: string; preserveRelation?: string; targetRange?: { startFrame: number; endFrame: number } }>;
    composition?: { opening?: string; primarySubject?: string; supportingSubjects?: string[];
      spatialRelations?: Array<{ roles: string[]; relation: string }>; textAndGraphics?: string; ending?: string };
    sequence?: Array<{ unitId?: string; purpose?: string; subjects?: string[]; action?: string; retainedElements?: string[]; transition?: string }>;
    attentionPath?: string[];
    odBoundaries?: { locked?: string[]; adjustable?: string[]; escalation?: string };
  };
}

export function scopeReferenceManifest(manifest: ReferenceManifest, sceneIds: string[]): ReferenceManifest;
export function assertVisualDesign(scenes: ReferenceScene[], briefText?: string): void;
export function extractAuthorRequest(markdown: string, sceneIds: readonly string[]): AuthorRequest | undefined;
export function readFrozenAuthorRequest(manifest: ReferenceManifest, manifestPath: string, sceneIds?: readonly string[]): Promise<AuthorRequest | undefined>;
export interface AuthorRequest { text: string; sha256: string }

export interface ReferenceManifest {
  projectId: string;
  revision: number;
  briefPath?: string;
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
