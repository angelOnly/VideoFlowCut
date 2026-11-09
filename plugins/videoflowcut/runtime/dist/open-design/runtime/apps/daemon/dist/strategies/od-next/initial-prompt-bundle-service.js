import path from 'node:path';
import { OD_NEXT_BUNDLE_ECHO_GUARD_V2, detectOdNextDevicePlatformFromText, executionProfileFromStreamFormat, renderChatTurnHostProtocolInstructions, } from '@open-design/contracts';
import { detectDeckIntentSignal, detectMediaIntentSignal, detectPlatformIntentSignal, extractUserAuthoredSignalText, renderConnectedExternalMcpDirective, } from '../../prompts/system.js';
import { buildBrowserUseRunState, isBrowserUseRequested, renderBrowserUseUnavailablePrompt, } from '../../browser/index.js';
import { getProject, latchConversationIntentSignals, normalizeConversationSessionMode, } from '../../db.js';
import { readMcpConfig } from '../../mcp-config.js';
import { isTokenExpired, readAllTokens } from '../../mcp-tokens.js';
import { resolveProjectDir } from '../../projects.js';
import { getSnapshot } from '../../plugins/snapshots.js';
import { resolveOdNextStrategyRequestRecipeV2 } from '../../plugins/strategy-recipe.js';
import { resolveExternalMcpServersForRun } from '../../run-tool-bundle.js';
import { composeChatAgentTextPayload, resolveOdNextRequestUserPrompt, resolveResearchCommandContract, } from '../../runtimes/chat-prompt-inputs.js';
import { renderRunContextPrompt } from '../../runtimes/chat-run-context.js';
import { renderFrozenSkillRosterContext, resolveFrozenSkillBundleEntries, } from './frozen-skill-package.js';
import { loadOdNextTaskInputSnapshot, } from './task-input-snapshot.js';
// Keep this header grammar aligned with parseFormAnswers in @open-design/contracts.
const FORM_ANSWERS_HEADER_RE = /^\s*\[form answers(?:\s*[\u2014\-:]\s*([^\]\r\n]+))?\]\s*(?:\r?\n|$)/i;
function record(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : null;
}
function stringValue(value) {
    return typeof value === 'string' ? value : undefined;
}
function runScopedMcpServers(toolBundle) {
    const servers = record(toolBundle)?.mcpServers;
    return Array.isArray(servers) ? servers : [];
}
/** Resolve the installed strategy recipe using its existing execution profile. */
export async function resolveOdNextPromptRecipeForRun(input) {
    const snapshotId = stringValue(input.appliedPluginSnapshotId);
    if (!snapshotId)
        return null;
    const snapshot = getSnapshot(input.db, snapshotId);
    if (!snapshot?.strategy)
        return null;
    const resolvedRecipe = await resolveOdNextStrategyRequestRecipeV2({
        bundledPluginsDir: input.bundledPluginsDir,
        snapshot,
        executionProfile: executionProfileFromStreamFormat(input.streamFormat),
        atomPromptsEnabled: input.atomPromptsEnabled,
        loadAtomBodies: async (atomIds) => {
            const { loadBundledAtomBodiesStrict } = await import('../../plugins/atom-bodies.js');
            return loadBundledAtomBodiesStrict(input.db, atomIds);
        },
    });
    if (!resolvedRecipe)
        return null;
    return resolvedRecipe;
}
/**
 * Own the immutable request-stage Prompt Bundle assembly. The daemon
 * composition root supplies process/runtime dependencies; project, MCP,
 * frozen-input, and prompt ordering decisions stay together here.
 */
export function createOdNextInitialPromptBundleService(deps) {
    return async ({ meta, frozenSkillPackage, taskInputSnapshot }) => {
        const { agentId, message, currentPrompt, priorTranscript, systemPrompt, projectId: rawProjectId, conversationId: rawConversationId, skillId, skillIds, designSystemId, sessionMode, locale, research, context, titleGeneration, byokMediaDefaults, } = meta;
        const def = deps.getAgentDef(agentId);
        if (!def)
            throw new Error(`unknown agent: ${agentId}`);
        const projectId = stringValue(rawProjectId);
        const conversationId = stringValue(rawConversationId);
        const project = projectId ? getProject(deps.db, projectId) : null;
        const projectRoot = projectId
            ? resolveProjectDir(deps.projectsDir, projectId, project?.metadata)
            : null;
        const appliedPluginSnapshotId = stringValue(meta.appliedPluginSnapshotId);
        const runSessionMode = normalizeConversationSessionMode(sessionMode);
        const userPrompt = resolveOdNextRequestUserPrompt({
            message,
            currentPrompt,
            hasCurrentPrompt: Object.prototype.hasOwnProperty.call(meta, 'currentPrompt'),
        });
        const browserUse = buildBrowserUseRunState({
            requested: isBrowserUseRequested(message, currentPrompt, systemPrompt),
            agentId: def.id,
        });
        const freshIntentSignals = {
            deck: detectDeckIntentSignal(extractUserAuthoredSignalText(stringValue(message)), extractUserAuthoredSignalText(stringValue(currentPrompt))),
            media: detectMediaIntentSignal(extractUserAuthoredSignalText(stringValue(message)), extractUserAuthoredSignalText(stringValue(currentPrompt))),
            platform: detectPlatformIntentSignal(extractUserAuthoredSignalText(stringValue(message)), extractUserAuthoredSignalText(stringValue(currentPrompt))),
            devicePlatform: detectOdNextDevicePlatformFromText(extractUserAuthoredSignalText(stringValue(message)), extractUserAuthoredSignalText(stringValue(currentPrompt))),
        };
        const intentSignals = conversationId
            ? latchConversationIntentSignals(deps.db, conversationId, freshIntentSignals)
            : freshIntentSignals;
        const { odNextBundleHead, odNextRecipeIdentity, odNextRuntimeFacts, odNextStableContextPrompt, } = await deps.composeDaemonSystemPrompt({
            agentId,
            projectId,
            skillId,
            skillIds,
            designSystemId,
            streamFormat: def.streamFormat ?? 'plain',
            locale,
            sessionMode: runSessionMode,
            mediaExecution: meta.mediaExecution,
            byokMediaDefaults,
            appliedPluginSnapshotId: appliedPluginSnapshotId ?? null,
            freeformDeckSignal: intentSignals.deck,
            mediaHintSignal: intentSignals.media,
            platformHintSignal: intentSignals.platform,
            devicePlatformSignal: intentSignals.devicePlatform,
            workspaceScope: meta.workspaceScope,
            frozenSkillPackage,
        });
        const loadedTaskInputs = loadOdNextTaskInputSnapshot(taskInputSnapshot, path.join(deps.runtimeDataDir, 'od-next-task-inputs'));
        const runContextPrompt = renderRunContextPrompt(context, project?.metadata);
        const runtimeToolPrompt = deps.createAgentRuntimeToolPrompt(deps.daemonUrl, projectRoot && projectId ? { token: 'available' } : null);
        const researchCommandContract = resolveResearchCommandContract(research, userPrompt);
        const formAnswerMatch = FORM_ANSWERS_HEADER_RE.exec(typeof currentPrompt === 'string' ? currentPrompt : '');
        const formId = formAnswerMatch
            ? ((formAnswerMatch[1] || 'form').trim().replace(/[^\w.-]/g, '') || 'form').toLowerCase()
            : null;
        const formOverride = formId
            ? formId === 'discovery' || formId === 'task-type'
                ? `The <user_first_prompt> contains submitted answers for the ${formId} form. Apply them to the active OD Next plan. Do not re-emit that answered form or repeat fields it already answered.`
                : `The <user_first_prompt> contains submitted answers for the ${formId} form. Treat them as the active user turn and do not replay the answered form.`
            : '';
        const titleGenerationRecord = record(titleGeneration);
        const titleGenerationDirective = titleGenerationRecord?.enabled === true
            ? [
                'Internal title task:',
                'Before answering the user request, emit exactly one short title marker:',
                '<od-title>Title Here</od-title>',
                'Rules: 2-6 words, preserve the user request language, no quotes, no markdown, no punctuation unless necessary.',
                'Do not mention this title task to the user. Continue with the normal answer after the title marker.',
            ].join('\n')
            : '';
        let persistedMcpServers = [];
        if (!deps.sandboxEnabled) {
            try {
                persistedMcpServers = (await readMcpConfig(deps.runtimeDataDir)).servers;
            }
            catch (error) {
                console.warn('[mcp-config] prompt freeze read failed:', error);
            }
        }
        const { enabledServers: enabledPromptMcp, persistedTokenServerIds: promptTokenServerIds, } = resolveExternalMcpServersForRun({
            persistedServers: persistedMcpServers,
            runScopedServers: runScopedMcpServers(meta.toolBundle),
            sandboxMode: deps.sandboxEnabled,
        });
        const connectedPromptServerIds = new Set();
        if (promptTokenServerIds.size > 0) {
            try {
                const storedTokens = await readAllTokens(deps.runtimeDataDir);
                for (const [serverId, token] of Object.entries(storedTokens)) {
                    if (promptTokenServerIds.has(serverId)
                        && typeof token.accessToken === 'string'
                        && token.accessToken.length > 0
                        && !isTokenExpired(token)) {
                        connectedPromptServerIds.add(serverId);
                    }
                }
            }
            catch (error) {
                console.warn('[mcp-tokens] prompt freeze read failed:', error);
            }
        }
        const connectedExternalMcp = enabledPromptMcp
            .filter((server) => connectedPromptServerIds.has(server.id))
            .map((server) => ({ id: server.id, label: server.label }));
        // The Bundle is a tree, so the recipe head, the frozen Skill roster, the
        // Skill entries, and the attachment identities are four separate slots
        // instead of one '---'-joined blob.
        if (!odNextBundleHead || !odNextRecipeIdentity) {
            throw new TypeError('OD Next request Bundle requires a verified strategy recipe; refusing to compose an untyped payload.');
        }
        const result = composeChatAgentTextPayload({
            formOverride,
            daemonSystemPrompt: '',
            runtimeToolPrompt,
            researchCommandContract,
            runContextPrompt,
            connectedExternalMcpReference: renderConnectedExternalMcpDirective(connectedExternalMcp),
            browserUnavailableGuard: renderBrowserUseUnavailablePrompt(browserUse),
            titleGenerationDirective,
            clientSystemPrompt: [
                renderChatTurnHostProtocolInstructions(stringValue(meta.doneKey) ?? '', 'od_next_request', 
                // Same run locale the Bundle's own system prompt was composed with
                // (OPEND-2765): the follow-up suggestions are user-visible prose and
                // must not fall back to English on a localized run.
                stringValue(locale)).text,
                typeof systemPrompt === 'string' ? systemPrompt : '',
            ].filter(Boolean).join('\n\n---\n\n'),
            cwdReference: '',
            linkedDirectoryReferences: '',
            echoGuard: OD_NEXT_BUNDLE_ECHO_GUARD_V2,
            requestOrStageText: userPrompt,
            projectAttachmentReferences: '',
            commentAttachmentReferences: '',
            imageReferences: '',
            odNextRequestBundle: {
                head: odNextBundleHead,
                recipeIdentity: odNextRecipeIdentity,
                runtimeFacts: odNextRuntimeFacts ?? '',
                taskType: loadedTaskInputs.taskType,
                attachments: loadedTaskInputs.attachmentFactsText,
                taskConfiguration: loadedTaskInputs.taskConfigText,
                stableContext: odNextStableContextPrompt ?? '',
                priorTranscript: typeof priorTranscript === 'string' ? priorTranscript : '',
                frozenSkillPackage: renderFrozenSkillRosterContext(frozenSkillPackage),
                requestInputFacts: loadedTaskInputs.workspaceInputFactsText,
                userSelectedSkills: resolveFrozenSkillBundleEntries(frozenSkillPackage),
            },
            strategyInputStage: 'request',
        });
        return { text: result.composedPrompt };
    };
}
//# sourceMappingURL=initial-prompt-bundle-service.js.map