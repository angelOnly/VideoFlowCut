import {
  OD_NEXT_PRODUCTION_MARKER_PROTOCOL,
  parseOdNextPromptBundleV2,
  renderOdNextProductionReadyInstructions,
  type OdNextPromptBundleV2,
} from '@open-design/contracts';
import type { StrategyTaskExecutionRecord } from '../task-store.js';

export function usesProductionMarker(task: Pick<StrategyTaskExecutionRecord, 'promptBundle'>): boolean {
  try {
    return parseOdNextPromptBundleV2(task.promptBundle.text).coreSystemPrompt.outputContract
      .startsWith(OD_NEXT_PRODUCTION_MARKER_PROTOCOL);
  } catch { return false; }
}

function splitClientInstructions(bundle: OdNextPromptBundleV2): { gate: string; custom: string } {
  const client = bundle.context.clientSystemPrompt ?? '';
  const key = /^Plan-to-production continuation:[\s\S]*?<od-production-ready key="([a-f0-9]+)" \/>/.exec(client)?.[1];
  const gate = key ? renderOdNextProductionReadyInstructions(key) : '';
  return { gate, custom: gate && client.startsWith(gate) ? client.slice(gate.length) : client };
}

/** 比较有效指令，不把每次生成的快照标识当成规则变化。 */
function stableInstructions(bundle: OdNextPromptBundleV2): Record<string, unknown> {
  return {
    core: bundle.coreSystemPrompt,
    orchestration: bundle.sessionSkills.generalOrchestrationSkill,
    taskSkill: bundle.sessionSkills.taskTypeSkill,
    selectedSkills: bundle.sessionSkills.userSelectedSkills,
    stages: bundle.activeStages,
    taskType: bundle.taskMetadata.taskType,
    configuration: bundle.taskMetadata.taskConfiguration,
    stableContext: bundle.context.stableRequestContext,
    research: bundle.context.researchCommandContract,
    mcp: bundle.context.connectedExternalMcp,
    browser: bundle.context.browserUnavailableGuard,
    custom: splitClientInstructions(bundle).custom,
  };
}

/** 原生续作只传变更模块，并明确替换或清除旧规则。 */
export function composeResumedRequest(task: Pick<StrategyTaskExecutionRecord, 'promptBundle' | 'taskExecutionId'>, previous: Pick<StrategyTaskExecutionRecord, 'promptBundle'>): string | null {
  if (!usesProductionMarker(task) || !usesProductionMarker(previous)) return null;
  const current = parseOdNextPromptBundleV2(task.promptBundle.text);
  const prior = parseOdNextPromptBundleV2(previous.promptBundle.text);
  const { gate } = splitClientInstructions(current);
  if (!gate) return null;
  const context = current.context;
  const currentInstructions = stableInstructions(current);
  const priorInstructions = stableInstructions(prior);
  const instructionChanges = Object.keys(currentInstructions).flatMap((key) => {
    const value = currentInstructions[key];
    if (JSON.stringify(value) === JSON.stringify(priorInstructions[key])) return [];
    return [value === undefined || value === ''
      ? `Instruction component ${key}: cleared. Its previous value no longer applies.`
      : `Instruction component ${key} updated; this replaces its previous value:\n${typeof value === 'string' ? value : JSON.stringify(value)}`];
  });
  const parts = [
    'Follow the current user request. For a new design deliverable, finish an actionable plan before production; do not build in the planning turn. For an existing actionable plan, continue directly when requested.',
    current.sessionSkills.taskTypeSkill.skillName === 'discovery'
      ? 'Reassess deliverables for this request using the existing discovery catalog. For a new deliverable type, use native file reading to load its main Skill before planning or editing. Reuse complete same-version bodies already in context; do not reload unrelated types. HTML is a format, not a reason to select prototype. A prior chat-only turn does not satisfy this prerequisite. Keep replies in the user\'s language; omit internal routing and tool commands unless requested.'
      : '',
    gate,
    ...instructionChanges,
    contextDelta('Runtime facts', context.runtimeFacts, prior.context.runtimeFacts),
    contextDelta('Runtime tool environment', context.runtimeToolEnvironment, prior.context.runtimeToolEnvironment),
    contextDelta('Workspace input references', context.requestInputFacts, prior.context.requestInputFacts),
    contextDelta('Frozen skill package', context.frozenSkillPackage, prior.context.frozenSkillPackage),
    contextDelta('Selected run context', context.runContext, prior.context.runContext),
    context.formOverride,
    contextDelta('Attachment references', current.taskMetadata.attachments, prior.taskMetadata.attachments),
    current.taskMetadata.titleDirective,
    `Current user request:\n${current.userFirstPrompt}`,
  ];
  return parts.filter(part => typeof part === 'string' && part.trim()).join('\n\n');
}

function contextDelta(label: string, current: string | undefined, previous: string | undefined): string {
  if ((current ?? '') === (previous ?? '')) return '';
  return current?.trim()
    ? `${label} updated; this replaces the previous value:\n${current}`
    : `${label}: cleared. The previous value no longer applies to this turn.`;
}
