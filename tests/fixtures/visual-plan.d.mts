export const completeResearchCoverage: {
  overallVisual: "covered"; sceneComposition: "covered"; motionMechanisms: "covered"; blockingQuestions: string[];
  layerNotes: { overallVisual: string; sceneComposition: string; motionMechanisms: string }
};
export function researchPlan(role: string, researchDecisionId: string,
  levels?: Array<"overallVisual" | "sceneComposition" | "motionMechanisms">): ReturnType<typeof visualPlan> & {
    researchLayers: Array<{ level: "overallVisual" | "sceneComposition" | "motionMechanisms"; researchDecisionId: string; designExcerpt: string }>
  };
export function visualPlan(role: string): {
  primaryRoles: string[];
  composition: { opening: string; primarySubject: string; supportingSubjects: string[];
    spatialRelations: Array<{ roles: string[]; relation: string }>; textAndGraphics: string; ending: string };
  sequence: Array<{ purpose: string; subjects: string[]; action: string; retainedElements: string[]; transition: string }>;
  attentionPath: string[];
  odBoundaries: { locked: string[]; adjustable: string[]; escalation: string };
};
export function directorBrief(...plans: unknown[]): string;
