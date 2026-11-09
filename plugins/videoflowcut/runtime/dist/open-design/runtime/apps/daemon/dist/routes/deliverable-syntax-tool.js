import { performance } from 'node:perf_hooks';
import { DELIVERABLE_SYNTAX_CHECKER, DELIVERABLE_SYNTAX_REPAIR_SCHEMA, DELIVERABLE_SYNTAX_TOOL_SCHEMA, } from '@open-design/contracts';
import { checkDeliverableSyntax, } from '../artifacts/deliverable-syntax.js';
import { recordDeliverableSyntaxCheck } from '../artifacts/deliverable-syntax-metrics.js';
import { DEFAULT_DELIVERABLE_SYNTAX_REPAIR_MAX_ATTEMPTS, decideDeliverableSyntaxRepair, renderDeliverableSyntaxRepairPrompt, } from '../artifacts/deliverable-syntax-repair.js';
import { sendApiError } from '../http/api-errors.js';
import { validateRunDeliverable } from '../run-deliverable-validation.js';
import { resolveProjectDir } from '../projects.js';
function storedRepairState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    const candidate = value;
    if (candidate.schema !== DELIVERABLE_SYNTAX_REPAIR_SCHEMA
        || !Number.isInteger(candidate.attempt)
        || Number(candidate.attempt) < 1
        || !Number.isInteger(candidate.maxAttempts)
        || Number(candidate.maxAttempts) < 1
        || candidate.checker !== DELIVERABLE_SYNTAX_CHECKER
        || typeof candidate.candidateHash !== 'string') {
        return undefined;
    }
    return candidate;
}
function incompleteCanonicalResult(validation) {
    return {
        schema: DELIVERABLE_SYNTAX_TOOL_SCHEMA,
        status: 'incomplete',
        reason: `canonical_${validation}`,
        checker: null,
        candidateHash: null,
        checkedFiles: [],
        diagnostics: [],
        repair: {
            action: 'none',
            attempt: 0,
            maxAttempts: DEFAULT_DELIVERABLE_SYNTAX_REPAIR_MAX_ATTEMPTS,
        },
    };
}
function toolResponse(result, previous) {
    const decision = decideDeliverableSyntaxRepair({
        result,
        previous,
        maxAttempts: DEFAULT_DELIVERABLE_SYNTAX_REPAIR_MAX_ATTEMPTS,
    });
    const attempt = decision.next?.attempt ?? previous?.attempt ?? 0;
    const maxAttempts = decision.next?.maxAttempts
        ?? previous?.maxAttempts
        ?? DEFAULT_DELIVERABLE_SYNTAX_REPAIR_MAX_ATTEMPTS;
    if (decision.action === 'retry') {
        if (result.status !== 'repairable') {
            throw new Error('Repair policy requested a retry without a repairable syntax result.');
        }
        return {
            schema: DELIVERABLE_SYNTAX_TOOL_SCHEMA,
            ...result,
            repair: { action: 'repair', attempt, maxAttempts },
            agentMessage: renderDeliverableSyntaxRepairPrompt({
                result,
                attempt,
                maxAttempts,
            }),
        };
    }
    if (decision.action === 'block') {
        if (result.status !== 'repairable') {
            throw new Error('Repair policy blocked a non-repairable syntax result.');
        }
        return {
            schema: DELIVERABLE_SYNTAX_TOOL_SCHEMA,
            ...result,
            status: 'exhausted',
            repair: {
                action: 'stop',
                attempt,
                maxAttempts,
                reason: decision.reason,
            },
        };
    }
    if (result.status === 'repairable') {
        throw new Error('Repair policy accepted a repairable syntax result.');
    }
    return {
        schema: DELIVERABLE_SYNTAX_TOOL_SCHEMA,
        ...result,
        repair: { action: 'none', attempt, maxAttempts },
    };
}
export function registerDeliverableSyntaxToolRoutes(app, ctx) {
    app.post('/api/tools/deliverable-syntax/check', async (req, res) => {
        try {
            const grant = ctx.authorizeToolRequest(req, res, 'deliverable-syntax:check');
            if (!grant)
                return;
            if (!await ctx.authorizeProjectToolRequest(res, grant.projectId, { mode: 'read' }))
                return;
            const project = ctx.getProject(grant.projectId);
            if (!project) {
                sendApiError(res, 404, 'PROJECT_NOT_FOUND', 'project not found');
                return;
            }
            const run = ctx.getRun(grant.runId);
            if (!run) {
                sendApiError(res, 409, 'NOT_FOUND', 'tool run is no longer available');
                return;
            }
            const deliverable = await validateRunDeliverable({
                projectsRoot: ctx.projectsRoot,
                projectId: grant.projectId,
                ...(project.metadata === undefined
                    ? {}
                    : { projectMetadata: project.metadata }),
                runStatus: 'succeeded',
                // This in-turn tool resolves the canonical entry, not final delivery
                // attribution. The finalizer remains authoritative for touched output.
                artifactCount: 1,
            });
            if (!deliverable.valid || !deliverable.entryFile) {
                const response = incompleteCanonicalResult(deliverable.validation);
                run.deliverableSyntaxValidation = {
                    ...response,
                    source: 'agent_tool',
                    checkedAt: Date.now(),
                };
                ctx.persistRunState(run);
                res.json(response);
                return;
            }
            const projectRoot = resolveProjectDir(ctx.projectsRoot, grant.projectId, project.metadata);
            const relatedPaths = deliverable.artifactKind === 'html'
                ? await ctx.relatedPathsForRun({ runId: grant.runId, projectRoot })
                : [];
            const checkerStartedAt = ctx.monotonicNow?.() ?? performance.now();
            const result = await checkDeliverableSyntax({
                projectRoot,
                entryFile: deliverable.artifactKind === 'html' ? deliverable.entryFile : null,
                relatedPaths,
            });
            const checkerDurationMs = Math.max(0, (ctx.monotonicNow?.() ?? performance.now()) - checkerStartedAt);
            const checkedAt = Date.now();
            const previous = storedRepairState(run.deliverableSyntaxRepair);
            const response = toolResponse(result, previous);
            const decision = decideDeliverableSyntaxRepair({
                result,
                previous,
                maxAttempts: DEFAULT_DELIVERABLE_SYNTAX_REPAIR_MAX_ATTEMPTS,
            });
            if (decision.next)
                run.deliverableSyntaxRepair = decision.next;
            run.deliverableSyntaxValidation = {
                ...response,
                source: 'agent_tool',
                checkedAt,
                metrics: recordDeliverableSyntaxCheck({
                    ...(run.deliverableSyntaxValidation?.metrics
                        ? { previous: run.deliverableSyntaxValidation.metrics }
                        : {}),
                    result,
                    durationMs: checkerDurationMs,
                    checkedAtMs: checkedAt,
                }),
            };
            ctx.persistRunState(run);
            res.json(response);
        }
        catch (error) {
            sendApiError(res, 500, 'INTERNAL_ERROR', error instanceof Error ? error.message : String(error));
        }
    });
}
//# sourceMappingURL=deliverable-syntax-tool.js.map