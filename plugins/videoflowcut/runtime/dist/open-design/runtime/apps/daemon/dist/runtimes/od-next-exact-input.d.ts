export declare const OD_NEXT_EXACT_INPUT_MAP_VERSION: 'open-design.od-next-exact-input-map/v2';
/**
 * Every addressable node of the v2 Prompt Bundle tree that a text contributor
 * may own, in canonical document order.
 *
 * A contributor names the exact node it fills rather than one of four flat
 * blocks, so the ownership map records where the bytes land. The bare
 * `open_design_core_system_prompt` path stays addressable because the recipe
 * aggregate contributes several of its children at once; the constant head's
 * leaves are listed so a future per-leaf contributor has a legal target without
 * widening the union.
 *
 * `active_stages` is the aggregate target for stage content: `stage`/`atom`
 * children are addressed by their `name` attribute, not by a static path, so
 * they are not separate union members.
 *
 * The split follows the bundle's cache invariant: only cross-task-constant
 * content may sit in the head (`open_design_core_system_prompt`,
 * `session_skills`, `active_stages`), which is why the per-run tool prompt, the
 * caller's system prompt, and the first-run form override are `context/*` paths
 * here.
 */
export declare const OD_NEXT_BUNDLE_NODE_PATHS_V2: readonly ['open_design_core_system_prompt', 'open_design_core_system_prompt/execution_boundary', 'open_design_core_system_prompt/native_execution', 'open_design_core_system_prompt/discovery_and_planning_surface', 'open_design_core_system_prompt/core_strategy', 'open_design_core_system_prompt/output_contract', 'open_design_core_system_prompt/echo_guard', 'session_skills/general_orchestration_skill', 'session_skills/task_type_skill', 'session_skills/user_selected_skills', 'active_stages', 'task_metadata/task_type', 'task_metadata/attachments', 'task_metadata/task_configuration', 'task_metadata/title_directive', 'context/recipe_identity', 'context/runtime_facts', 'context/runtime_tool_environment', 'context/stable_request_context', 'context/frozen_skill_package', 'context/request_input_facts', 'context/research_command_contract', 'context/run_context', 'context/connected_external_mcp', 'context/browser_unavailable_guard', 'context/client_system_prompt', 'context/form_override', 'context/prior_transcript', 'user_first_prompt'];
export type OdNextBundleNodePathV2 = (typeof OD_NEXT_BUNDLE_NODE_PATHS_V2)[number];
export type OdNextExactInputClassification = 'initial_bundle' | 'stage_turn' | 'transport_reference' | 'out_of_band' | 'excluded';
export type OdNextExactInputStage = 'request' | 'clarification' | 'contract_repair' | 'production';
export type OdNextExactInputEntry = Readonly<{
    id: string;
    classification: OdNextExactInputClassification;
    source: string;
    owner: string;
    textTarget?: OdNextBundleNodePathV2;
    stage?: 'clarification' | 'contract_repair' | 'production';
    note: string;
}>;
export type OdNextSemanticRequestFactEntry = Readonly<{
    id: string;
    classification: 'initial_bundle' | 'transport_reference' | 'out_of_band' | 'excluded';
    producer?: 'daemon_system_prompt' | 'request';
    source: string;
    owner: string;
    textTarget?: OdNextBundleNodePathV2;
    note: string;
}>;
/**
 * Every leaf text input consumed by the ordinary production Markdown composer,
 * which is the non-OD-Next path and still emits flat Markdown sections.
 *
 * Keeping this list separate from the ownership map makes an unregistered
 * addition fail at the production seam instead of silently escaping the OD Next
 * XML root.
 */
export declare const OD_NEXT_LEGACY_TEXT_CONTRIBUTOR_IDS_V1: readonly ['form_override', 'daemon_system_prompt', 'runtime_tool_prompt', 'research_command_contract', 'run_context_prompt', 'connected_external_mcp_reference', 'browser_unavailable_guard', 'title_generation_directive', 'client_system_prompt', 'cwd_reference', 'linked_directory_references', 'echo_guard', 'request_text', 'project_attachment_references', 'comment_attachment_references', 'image_references'];
export type OdNextLegacyTextContributorId = (typeof OD_NEXT_LEGACY_TEXT_CONTRIBUTOR_IDS_V1)[number];
/**
 * Every leaf text input consumed by the canonical OD Next request Bundle, in
 * the tree's canonical node order.
 */
export declare const OD_NEXT_BUNDLE_TEXT_CONTRIBUTOR_IDS_V2: readonly ['daemon_system_prompt', 'echo_guard', 'user_selected_skills', 'task_type_fact', 'attachment_facts', 'task_config_pending_fact', 'title_generation_directive', 'recipe_identity', 'runtime_facts', 'runtime_tool_prompt', 'stable_context_prompt', 'frozen_skill_package', 'request_input_facts', 'research_command_contract', 'run_context_prompt', 'connected_external_mcp_reference', 'browser_unavailable_guard', 'client_system_prompt', 'form_override', 'prior_transcript', 'request_text'];
export type OdNextBundleTextContributorIdV2 = (typeof OD_NEXT_BUNDLE_TEXT_CONTRIBUTOR_IDS_V2)[number];
/**
 * Final text-segment and transport ownership map. Aggregate entries such as
 * `daemon_system_prompt` deliberately remain aggregates here; their semantic
 * leaves are enumerated in OD_NEXT_SEMANTIC_REQUEST_FACT_MAP_V1 below.
 * `source` names a real production symbol/seam, not a product-spec alias.
 * `textTarget` names the exact v2 Bundle node the bytes land in.
 */
export declare const OD_NEXT_EXACT_INPUT_MAP_V1: readonly [{
    readonly id: 'daemon_system_prompt';
    readonly classification: 'initial_bundle';
    readonly source: 'composeDaemonSystemPrompt().prompt';
    readonly owner: 'bundle serializer';
    readonly textTarget: 'open_design_core_system_prompt';
    readonly note: 'Structured recipe aggregate: contributes open_design_core_system_prompt, session_skills and active_stages as elements. Cross-task constant.';
}, {
    readonly id: 'echo_guard';
    readonly classification: 'initial_bundle';
    readonly source: 'startChatRun.ECHO_GUARD';
    readonly owner: 'bundle serializer';
    readonly textTarget: 'open_design_core_system_prompt/echo_guard';
    readonly note: 'Constant; references the `<open_design_core_system_prompt>` and `<user_first_prompt>` tag names.';
}, {
    readonly id: 'user_selected_skills';
    readonly classification: 'initial_bundle';
    readonly source: 'resolveFrozenSkillBundleEntries() selected Skill paths';
    readonly owner: 'Task 03 immutable Skill package';
    readonly textTarget: 'session_skills/user_selected_skills';
    readonly note: 'Frozen selected Skill identities and file paths; the author reads the applicable body on demand.';
}, {
    readonly id: 'task_type_fact';
    readonly classification: 'initial_bundle';
    readonly source: 'loadOdNextTaskInputSnapshot().taskConfigText -> OdNextTaskConfigurationV1.taskType';
    readonly owner: 'Task 04 canonical task configuration snapshot';
    readonly textTarget: 'task_metadata/task_type';
    readonly note: 'Resolved task type from the frozen task-input snapshot.';
}, {
    readonly id: 'attachment_facts';
    readonly classification: 'initial_bundle';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText -> OdNextRequestInputFactsV1.attachments';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly textTarget: 'task_metadata/attachments';
    readonly note: 'Immutable attachment identities (reference, mime type, digest); never attachment bodies or absolute paths.';
}, {
    readonly id: 'task_config_pending_fact';
    readonly classification: 'initial_bundle';
    readonly source: 'loadOdNextTaskInputSnapshot().taskConfigText';
    readonly owner: 'Task 04 canonical task configuration snapshot';
    readonly textTarget: 'task_metadata/task_configuration';
    readonly note: 'Canonical allowlisted task type, locale, selected agent, route, mode and execution configuration.';
}, {
    readonly id: 'title_generation_directive';
    readonly classification: 'initial_bundle';
    readonly source: 'startChatRun.titleGenerationPrompt';
    readonly owner: 'bundle serializer';
    readonly textTarget: 'task_metadata/title_directive';
    readonly note: 'Internal title marker directive; per-task presence.';
}, {
    readonly id: 'recipe_identity';
    readonly classification: 'initial_bundle';
    readonly source: 'resolveOdNextStrategyRequestRecipeV2() identity fields + strategy task snapshotId';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/recipe_identity';
    readonly note: 'Per-task strategy identity incl. applied snapshot id. Lives here, not in the head, so the per-task UUID does not cut the shared cache prefix. Audit-only package hash, Task Skill digest and stable prompt identity are deliberately not emitted.';
}, {
    readonly id: 'runtime_facts';
    readonly classification: 'initial_bundle';
    readonly source: 'empty runtime facts slot';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/runtime_facts';
    readonly note: 'The existing Bundle slot stays empty; runtime capability proof is no longer sent to the model.';
}, {
    readonly id: 'runtime_tool_prompt';
    readonly classification: 'initial_bundle';
    readonly source: 'createAgentRuntimeToolPrompt()';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/runtime_tool_environment';
    readonly note: 'Textual tool contract embedding the per-run daemon URL; executable capability and credentials remain transport facts.';
}, {
    readonly id: 'stable_context_prompt';
    readonly classification: 'initial_bundle';
    readonly source: 'composeOdNextStrategyStableRequestContextV2()';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/stable_request_context';
    readonly note: 'Stable project, design, instruction and memory context.';
}, {
    readonly id: 'frozen_skill_package';
    readonly classification: 'initial_bundle';
    readonly source: 'renderFrozenSkillRosterContext() frozen identity/roster JSON';
    readonly owner: 'Task 03 immutable Skill package';
    readonly textTarget: 'context/frozen_skill_package';
    readonly note: 'Task-owned frozen Skill identity and side-file roster. Omitted entirely when the user selected no Skill.';
}, {
    readonly id: 'request_input_facts';
    readonly classification: 'initial_bundle';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable request inputs';
    readonly textTarget: 'context/request_input_facts';
    readonly note: 'Immutable attachment/workspace/MCP references with no absolute paths. Omitted entirely when no attachment, comment, MCP server or linked directory is present.';
}, {
    readonly id: 'research_command_contract';
    readonly classification: 'initial_bundle';
    readonly source: 'resolveResearchCommandContract()';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/research_command_contract';
    readonly note: 'Research contract for the canonical current turn only.';
}, {
    readonly id: 'run_context_prompt';
    readonly classification: 'initial_bundle';
    readonly source: 'renderRunContextPrompt()';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/run_context';
    readonly note: 'User-selected workspace context, plugins, MCP servers and connectors.';
}, {
    readonly id: 'connected_external_mcp_reference';
    readonly classification: 'transport_reference';
    readonly source: 'renderConnectedExternalMcpDirective()';
    readonly owner: 'bundle context reference';
    readonly textTarget: 'context/connected_external_mcp';
    readonly note: 'Already-authenticated external MCP server references, frozen per task.';
}, {
    readonly id: 'browser_unavailable_guard';
    readonly classification: 'initial_bundle';
    readonly source: 'renderBrowserUseUnavailablePrompt()';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/browser_unavailable_guard';
    readonly note: 'Browser-automation unavailability reason, frozen per task.';
}, {
    readonly id: 'client_system_prompt';
    readonly classification: 'initial_bundle';
    readonly source: 'ChatRequest.systemPrompt';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/client_system_prompt';
    readonly note: 'Caller-supplied system prompt; per-task, so excluded from the cache-stable head.';
}, {
    readonly id: 'form_override';
    readonly classification: 'initial_bundle';
    readonly source: 'startChatRun.formOverride';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/form_override';
    readonly note: 'First-run form-answer control text; per-task, so excluded from the cache-stable head.';
}, {
    readonly id: 'prior_transcript';
    readonly classification: 'initial_bundle';
    readonly source: 'buildDaemonPriorTranscript(history, agentId) -> ChatRequest.priorTranscript';
    readonly owner: 'bundle context serializer';
    readonly textTarget: 'context/prior_transcript';
    readonly note: 'Agent-scoped transcript ending before the canonical current user turn.';
}, {
    readonly id: 'request_text';
    readonly classification: 'initial_bundle';
    readonly source: 'resolveOdNextRequestUserPrompt({ message, currentPrompt, hasCurrentPrompt })';
    readonly owner: 'stage-aware bundle/turn selector';
    readonly textTarget: 'user_first_prompt';
    readonly note: 'Explicit currentPrompt property presence wins even for null/empty; message is used only when the property is absent.';
}, {
    readonly id: 'cwd_reference';
    readonly classification: 'excluded';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable workspace reference';
    readonly note: 'The live workspace path is excluded; task-input facts emit only workspace:project while the real cwd stays out of band.';
}, {
    readonly id: 'linked_directory_references';
    readonly classification: 'excluded';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable workspace reference';
    readonly note: 'Live linked-directory paths are excluded; stable linked-dir:N aliases are emitted while access stays out of band.';
}, {
    readonly id: 'clarification_turn';
    readonly classification: 'stage_turn';
    readonly source: 'persisted historical clarification finalText';
    readonly owner: 'turn serializer';
    readonly stage: 'clarification';
    readonly note: 'Persisted text identity for historical records only; no new clarification or repair turns are created.';
}, {
    readonly id: 'contract_repair_turn';
    readonly classification: 'stage_turn';
    readonly source: 'persisted historical contract-repair finalText';
    readonly owner: 'turn serializer';
    readonly stage: 'contract_repair';
    readonly note: 'Persisted text identity for historical records only; no new clarification or repair turns are created.';
}, {
    readonly id: 'production_turn';
    readonly classification: 'stage_turn';
    readonly source: 'composeOdNextMarkerProductionTurn()';
    readonly owner: 'turn serializer';
    readonly stage: 'production';
    readonly note: 'Marker-authorized production continuation; does not re-seed the first Bundle.';
}, {
    readonly id: 'project_attachment_references';
    readonly classification: 'excluded';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Live paths are excluded; task-input references resolve under the out-of-band OD_TASK_INPUT_DIR Run projection.';
}, {
    readonly id: 'comment_attachment_references';
    readonly classification: 'excluded';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Live comment bodies and paths are excluded; only a path/body-free count is emitted.';
}, {
    readonly id: 'image_references';
    readonly classification: 'excluded';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Live image paths are excluded; frozen identity references are emitted while Run-projection resource paths stay out of band.';
}, {
    readonly id: 'effective_cwd_capability';
    readonly classification: 'out_of_band';
    readonly source: 'startChatRun.effectiveCwd';
    readonly owner: 'runtime transport';
    readonly note: 'Spawn cwd / ACP session cwd; not prompt text.';
}, {
    readonly id: 'linked_directory_allowlist';
    readonly classification: 'out_of_band';
    readonly source: 'resolveChatExtraAllowedDirs()';
    readonly owner: 'runtime transport';
    readonly note: 'Filesystem capability passed via adapter arguments; not prompt text.';
}, {
    readonly id: 'image_binary_input';
    readonly classification: 'out_of_band';
    readonly source: 'buildArgs imagePaths / attachPiRpcSession.imagePaths / attachAcpSession.imagePaths';
    readonly owner: 'runtime transport';
    readonly note: 'Binary or runtime-native image input; references are represented separately.';
}, {
    readonly id: 'mcp_server_registrations';
    readonly classification: 'out_of_band';
    readonly source: 'buildLiveArtifactsMcpServersForAgent(); Claude/Codebuddy .mcp.json; OpenCode/MiMo env-content; attachAcpSession.mcpServers';
    readonly owner: 'runtime transport';
    readonly note: 'External, run-scoped and live-artifact MCP registrations never become Bundle text.';
}, {
    readonly id: 'mcp_oauth_credentials';
    readonly classification: 'out_of_band';
    readonly source: 'buildClaudeMcpJson() / buildOpenCodeMcpConfigContent()';
    readonly owner: 'runtime transport';
    readonly note: 'Bearer OAuth injection into .mcp.json or OpenCode/MiMo env-content; ACP currently admits stdio registrations only.';
}, {
    readonly id: 'runtime_tool_environment';
    readonly classification: 'out_of_band';
    readonly source: 'createOpenDesignToolEnv() / spawnEnvForAgent() including OD_TOOL_TOKEN';
    readonly owner: 'runtime transport';
    readonly note: 'Executable paths, daemon/data coordinates and the scoped tool credential are child environment facts, not Bundle text.';
}, {
    readonly id: 'runtime_model_options';
    readonly classification: 'out_of_band';
    readonly source: 'RuntimeAgentDef.buildArgs agentOptions / ACP model';
    readonly owner: 'runtime transport';
    readonly note: 'Model, reasoning, service tier and execution profile are launch/session configuration.';
}, {
    readonly id: 'native_session_resume_identity';
    readonly classification: 'out_of_band';
    readonly source: 'resolveAgentResumeContext()';
    readonly owner: 'runtime transport';
    readonly note: 'Resume handle and stable-prefix cache diagnostics are not task Bundle content.';
}, {
    readonly id: 'skill_side_files';
    readonly classification: 'out_of_band';
    readonly source: 'materializeFrozenSkillPackage() / RuntimeAgentDef extraAllowedDirs';
    readonly owner: 'Task 03 immutable Skill package';
    readonly note: 'Filesystem package contains the selected Skill body and references at their fixed versions.';
}, {
    readonly id: 'project_attachment_bytes';
    readonly classification: 'out_of_band';
    readonly source: 'createOdNextRunInputProjection() -> OD_TASK_INPUT_DIR / ACP resource_link';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Canonical bytes are daemon-only; Agent-readable copies live in a per-Run projection and only identity/reference/env-root semantics belong in Bundle text.';
}, {
    readonly id: 'transport_wrapper_syntax';
    readonly classification: 'excluded';
    readonly source: 'prompt file / argv / stdin / stream-json / Pi RPC / ACP wrappers';
    readonly owner: 'runtime transport';
    readonly note: 'A wrapper may encode the exact text but must not change or be counted as canonical inner text.';
}, {
    readonly id: 'available_skills_index';
    readonly classification: 'excluded';
    readonly source: 'not produced';
    readonly owner: 'explicit product exclusion';
    readonly note: 'The all-Skills catalogue is intentionally absent from Bundle, Turn, telemetry and tests.';
}, {
    readonly id: 'stable_prompt_hash';
    readonly classification: 'excluded';
    readonly source: 'hashStableInstructions()';
    readonly owner: 'conversation+agent cache diagnostics';
    readonly note: 'Not task Bundle identity and must never trigger Bundle reconstruction or re-seeding.';
}];
/**
 * Semantic request facts below the final text aggregates. Task 02 decides their
 * canonical XML representation; Tasks 03/04 freeze the mutable Skill and
 * attachment/config facts. Keeping this layer executable prevents the final
 * `daemon_system_prompt`/`request_text` segments from hiding mutable inputs.
 */
export declare const OD_NEXT_SEMANTIC_REQUEST_FACT_MAP_V1: readonly [{
    readonly id: 'prior_transcript';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'buildDaemonPriorTranscript(history, agentId) -> ChatRequest.priorTranscript';
    readonly owner: 'Task 02 transcript/context serializer';
    readonly textTarget: 'context/prior_transcript';
    readonly note: 'Contains only agent-scoped history before the latest user turn; ChatRequest.message remains a legacy transport compatibility field.';
}, {
    readonly id: 'current_user_turn';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'latestUserPromptFromHistory(history) -> ChatRequest.currentPrompt';
    readonly owner: 'Task 02 user_first_prompt serializer';
    readonly textTarget: 'user_first_prompt';
    readonly note: 'Canonical latest user-authored turn. Property presence, not nullishness, selects this source.';
}, {
    readonly id: 'headless_message_fallback';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'od run start --message -> ChatRequest.message when currentPrompt is absent';
    readonly owner: 'Task 02 user_first_prompt serializer';
    readonly textTarget: 'user_first_prompt';
    readonly note: 'Compatibility fallback only when currentPrompt is not an own property; explicit null or empty never falls back.';
}, {
    readonly id: 'stable_context_prompt';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'composeOdNextStrategyStableRequestContextV2() -> odNextStableContextPrompt';
    readonly owner: 'Task 02 context serializer';
    readonly textTarget: 'context/stable_request_context';
    readonly note: 'The production Bundle receives this aggregate separately from the core recipe system prompt.';
}, {
    readonly id: 'task_config_pending_fact';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'loadOdNextTaskInputSnapshot().taskConfigText';
    readonly owner: 'Task 04 canonical task configuration';
    readonly textTarget: 'task_metadata/task_configuration';
    readonly note: 'Canonical immutable configuration loaded from the task-scoped snapshot manifest.';
}, {
    readonly id: 'request_input_pending_fact';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
    readonly owner: 'Task 04 immutable request inputs';
    readonly textTarget: 'context/request_input_facts';
    readonly note: 'Immutable attachment identities and controlled transport references are serialized here; attachment identities are additionally projected into task_metadata/attachments.';
}, {
    readonly id: 'strategy_task_skill';
    readonly classification: 'initial_bundle';
    readonly producer: 'daemon_system_prompt';
    readonly source: 'resolveOdNextStrategyRequestRecipeV2().taskSkill';
    readonly owner: 'Task 02 Bundle head serializer';
    readonly textTarget: 'session_skills/task_type_skill';
    readonly note: 'Pinned Task Skill from the verified strategy package, distinct from user-selected @Skills.';
}, {
    readonly id: 'strategy_task_type';
    readonly classification: 'initial_bundle';
    readonly producer: 'daemon_system_prompt';
    readonly source: 'AppliedStrategyBindingV2.selectedTaskProfile / resolvedRecipe.taskType';
    readonly owner: 'Task 02 core recipe; Task 04 canonical task configuration';
    readonly textTarget: 'task_metadata/task_type';
    readonly note: 'Selects the verified core recipe and is serialized as the canonical Task 04 task type.';
}, {
    readonly id: 'request_execution_configuration';
    readonly classification: 'out_of_band';
    readonly producer: 'request';
    readonly source: 'sessionMode, locale, research, mediaExecution, titleGeneration and selected runtime profile';
    readonly owner: 'Task 04 canonical task configuration';
    readonly note: 'The allowlisted stable subset is serialized in task_metadata; research/title/context remain their separately owned Bundle contributors.';
}, {
    readonly id: 'project_and_design_context';
    readonly classification: 'initial_bundle';
    readonly producer: 'daemon_system_prompt';
    readonly source: 'metadata, template, host-detected deck intent, design-system fields, craftBody/craftSections and memoryBody';
    readonly owner: 'Task 02 context serializer';
    readonly textTarget: 'context/stable_request_context';
    readonly note: 'Stable project/design facts currently nested in composeDaemonSystemPrompt().';
}, {
    readonly id: 'user_and_project_instructions';
    readonly classification: 'initial_bundle';
    readonly producer: 'daemon_system_prompt';
    readonly source: 'userInstructions + projectInstructions';
    readonly owner: 'Task 02 context serializer';
    readonly textTarget: 'context/stable_request_context';
    readonly note: 'Stable instruction facts currently nested in the daemon system aggregate.';
}, {
    readonly id: 'run_context_selection';
    readonly classification: 'initial_bundle';
    readonly producer: 'request';
    readonly source: 'ChatRequest.context -> renderRunContextPrompt()';
    readonly owner: 'Task 02 context serializer';
    readonly textTarget: 'context/run_context';
    readonly note: 'Explicit user-selected context facts, separate from transcript history.';
}, {
    readonly id: 'project_attachment_selection';
    readonly classification: 'out_of_band';
    readonly producer: 'request';
    readonly source: 'ChatRequest.attachments -> createOdNextTaskInputSnapshot()';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Raw and canonical paths stay daemon-only; the Bundle receives logical reference, byte length, media type, digest and the OD_TASK_INPUT_DIR resolver contract.';
}, {
    readonly id: 'comment_attachment_selection';
    readonly classification: 'out_of_band';
    readonly producer: 'request';
    readonly source: 'ChatRequest.commentAttachments -> normalizeCommentAttachments()';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Raw comment bodies and screenshot paths remain excluded; the Bundle carries only the canonical comment count.';
}, {
    readonly id: 'image_attachment_selection';
    readonly classification: 'out_of_band';
    readonly producer: 'request';
    readonly source: 'ChatRequest.imagePaths -> createOdNextTaskInputSnapshot()';
    readonly owner: 'Task 04 immutable attachment snapshot';
    readonly note: 'Runtime-native resources use per-Run projection paths out of band; the Bundle carries only logical reference and immutable identity.';
}, {
    readonly id: 'available_skills_catalogue';
    readonly classification: 'excluded';
    readonly source: 'not produced';
    readonly owner: 'explicit product exclusion';
    readonly note: 'No all-Skills catalogue is serialized or observed.';
}];
export declare const OD_NEXT_AGENT_INPUT_OWNERSHIP_V1: {
    readonly version: "open-design.od-next-exact-input-map/v2";
    readonly finalTextAndTransport: readonly [{
        readonly id: 'daemon_system_prompt';
        readonly classification: 'initial_bundle';
        readonly source: 'composeDaemonSystemPrompt().prompt';
        readonly owner: 'bundle serializer';
        readonly textTarget: 'open_design_core_system_prompt';
        readonly note: 'Structured recipe aggregate: contributes open_design_core_system_prompt, session_skills and active_stages as elements. Cross-task constant.';
    }, {
        readonly id: 'echo_guard';
        readonly classification: 'initial_bundle';
        readonly source: 'startChatRun.ECHO_GUARD';
        readonly owner: 'bundle serializer';
        readonly textTarget: 'open_design_core_system_prompt/echo_guard';
        readonly note: 'Constant; references the `<open_design_core_system_prompt>` and `<user_first_prompt>` tag names.';
    }, {
        readonly id: 'user_selected_skills';
        readonly classification: 'initial_bundle';
        readonly source: 'resolveFrozenSkillBundleEntries() selected Skill paths';
        readonly owner: 'Task 03 immutable Skill package';
        readonly textTarget: 'session_skills/user_selected_skills';
        readonly note: 'Frozen selected Skill identities and file paths; the author reads the applicable body on demand.';
    }, {
        readonly id: 'task_type_fact';
        readonly classification: 'initial_bundle';
        readonly source: 'loadOdNextTaskInputSnapshot().taskConfigText -> OdNextTaskConfigurationV1.taskType';
        readonly owner: 'Task 04 canonical task configuration snapshot';
        readonly textTarget: 'task_metadata/task_type';
        readonly note: 'Resolved task type from the frozen task-input snapshot.';
    }, {
        readonly id: 'attachment_facts';
        readonly classification: 'initial_bundle';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText -> OdNextRequestInputFactsV1.attachments';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly textTarget: 'task_metadata/attachments';
        readonly note: 'Immutable attachment identities (reference, mime type, digest); never attachment bodies or absolute paths.';
    }, {
        readonly id: 'task_config_pending_fact';
        readonly classification: 'initial_bundle';
        readonly source: 'loadOdNextTaskInputSnapshot().taskConfigText';
        readonly owner: 'Task 04 canonical task configuration snapshot';
        readonly textTarget: 'task_metadata/task_configuration';
        readonly note: 'Canonical allowlisted task type, locale, selected agent, route, mode and execution configuration.';
    }, {
        readonly id: 'title_generation_directive';
        readonly classification: 'initial_bundle';
        readonly source: 'startChatRun.titleGenerationPrompt';
        readonly owner: 'bundle serializer';
        readonly textTarget: 'task_metadata/title_directive';
        readonly note: 'Internal title marker directive; per-task presence.';
    }, {
        readonly id: 'recipe_identity';
        readonly classification: 'initial_bundle';
        readonly source: 'resolveOdNextStrategyRequestRecipeV2() identity fields + strategy task snapshotId';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/recipe_identity';
        readonly note: 'Per-task strategy identity incl. applied snapshot id. Lives here, not in the head, so the per-task UUID does not cut the shared cache prefix. Audit-only package hash, Task Skill digest and stable prompt identity are deliberately not emitted.';
    }, {
        readonly id: 'runtime_facts';
        readonly classification: 'initial_bundle';
        readonly source: 'empty runtime facts slot';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/runtime_facts';
        readonly note: 'The existing Bundle slot stays empty; runtime capability proof is no longer sent to the model.';
    }, {
        readonly id: 'runtime_tool_prompt';
        readonly classification: 'initial_bundle';
        readonly source: 'createAgentRuntimeToolPrompt()';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/runtime_tool_environment';
        readonly note: 'Textual tool contract embedding the per-run daemon URL; executable capability and credentials remain transport facts.';
    }, {
        readonly id: 'stable_context_prompt';
        readonly classification: 'initial_bundle';
        readonly source: 'composeOdNextStrategyStableRequestContextV2()';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/stable_request_context';
        readonly note: 'Stable project, design, instruction and memory context.';
    }, {
        readonly id: 'frozen_skill_package';
        readonly classification: 'initial_bundle';
        readonly source: 'renderFrozenSkillRosterContext() frozen identity/roster JSON';
        readonly owner: 'Task 03 immutable Skill package';
        readonly textTarget: 'context/frozen_skill_package';
        readonly note: 'Task-owned frozen Skill identity and side-file roster. Omitted entirely when the user selected no Skill.';
    }, {
        readonly id: 'request_input_facts';
        readonly classification: 'initial_bundle';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable request inputs';
        readonly textTarget: 'context/request_input_facts';
        readonly note: 'Immutable attachment/workspace/MCP references with no absolute paths. Omitted entirely when no attachment, comment, MCP server or linked directory is present.';
    }, {
        readonly id: 'research_command_contract';
        readonly classification: 'initial_bundle';
        readonly source: 'resolveResearchCommandContract()';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/research_command_contract';
        readonly note: 'Research contract for the canonical current turn only.';
    }, {
        readonly id: 'run_context_prompt';
        readonly classification: 'initial_bundle';
        readonly source: 'renderRunContextPrompt()';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/run_context';
        readonly note: 'User-selected workspace context, plugins, MCP servers and connectors.';
    }, {
        readonly id: 'connected_external_mcp_reference';
        readonly classification: 'transport_reference';
        readonly source: 'renderConnectedExternalMcpDirective()';
        readonly owner: 'bundle context reference';
        readonly textTarget: 'context/connected_external_mcp';
        readonly note: 'Already-authenticated external MCP server references, frozen per task.';
    }, {
        readonly id: 'browser_unavailable_guard';
        readonly classification: 'initial_bundle';
        readonly source: 'renderBrowserUseUnavailablePrompt()';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/browser_unavailable_guard';
        readonly note: 'Browser-automation unavailability reason, frozen per task.';
    }, {
        readonly id: 'client_system_prompt';
        readonly classification: 'initial_bundle';
        readonly source: 'ChatRequest.systemPrompt';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/client_system_prompt';
        readonly note: 'Caller-supplied system prompt; per-task, so excluded from the cache-stable head.';
    }, {
        readonly id: 'form_override';
        readonly classification: 'initial_bundle';
        readonly source: 'startChatRun.formOverride';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/form_override';
        readonly note: 'First-run form-answer control text; per-task, so excluded from the cache-stable head.';
    }, {
        readonly id: 'prior_transcript';
        readonly classification: 'initial_bundle';
        readonly source: 'buildDaemonPriorTranscript(history, agentId) -> ChatRequest.priorTranscript';
        readonly owner: 'bundle context serializer';
        readonly textTarget: 'context/prior_transcript';
        readonly note: 'Agent-scoped transcript ending before the canonical current user turn.';
    }, {
        readonly id: 'request_text';
        readonly classification: 'initial_bundle';
        readonly source: 'resolveOdNextRequestUserPrompt({ message, currentPrompt, hasCurrentPrompt })';
        readonly owner: 'stage-aware bundle/turn selector';
        readonly textTarget: 'user_first_prompt';
        readonly note: 'Explicit currentPrompt property presence wins even for null/empty; message is used only when the property is absent.';
    }, {
        readonly id: 'cwd_reference';
        readonly classification: 'excluded';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable workspace reference';
        readonly note: 'The live workspace path is excluded; task-input facts emit only workspace:project while the real cwd stays out of band.';
    }, {
        readonly id: 'linked_directory_references';
        readonly classification: 'excluded';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable workspace reference';
        readonly note: 'Live linked-directory paths are excluded; stable linked-dir:N aliases are emitted while access stays out of band.';
    }, {
        readonly id: 'clarification_turn';
        readonly classification: 'stage_turn';
        readonly source: 'persisted historical clarification finalText';
        readonly owner: 'turn serializer';
        readonly stage: 'clarification';
        readonly note: 'Persisted text identity for historical records only; no new clarification or repair turns are created.';
    }, {
        readonly id: 'contract_repair_turn';
        readonly classification: 'stage_turn';
        readonly source: 'persisted historical contract-repair finalText';
        readonly owner: 'turn serializer';
        readonly stage: 'contract_repair';
        readonly note: 'Persisted text identity for historical records only; no new clarification or repair turns are created.';
    }, {
        readonly id: 'production_turn';
        readonly classification: 'stage_turn';
        readonly source: 'composeOdNextMarkerProductionTurn()';
        readonly owner: 'turn serializer';
        readonly stage: 'production';
        readonly note: 'Marker-authorized production continuation; does not re-seed the first Bundle.';
    }, {
        readonly id: 'project_attachment_references';
        readonly classification: 'excluded';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Live paths are excluded; task-input references resolve under the out-of-band OD_TASK_INPUT_DIR Run projection.';
    }, {
        readonly id: 'comment_attachment_references';
        readonly classification: 'excluded';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Live comment bodies and paths are excluded; only a path/body-free count is emitted.';
    }, {
        readonly id: 'image_references';
        readonly classification: 'excluded';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Live image paths are excluded; frozen identity references are emitted while Run-projection resource paths stay out of band.';
    }, {
        readonly id: 'effective_cwd_capability';
        readonly classification: 'out_of_band';
        readonly source: 'startChatRun.effectiveCwd';
        readonly owner: 'runtime transport';
        readonly note: 'Spawn cwd / ACP session cwd; not prompt text.';
    }, {
        readonly id: 'linked_directory_allowlist';
        readonly classification: 'out_of_band';
        readonly source: 'resolveChatExtraAllowedDirs()';
        readonly owner: 'runtime transport';
        readonly note: 'Filesystem capability passed via adapter arguments; not prompt text.';
    }, {
        readonly id: 'image_binary_input';
        readonly classification: 'out_of_band';
        readonly source: 'buildArgs imagePaths / attachPiRpcSession.imagePaths / attachAcpSession.imagePaths';
        readonly owner: 'runtime transport';
        readonly note: 'Binary or runtime-native image input; references are represented separately.';
    }, {
        readonly id: 'mcp_server_registrations';
        readonly classification: 'out_of_band';
        readonly source: 'buildLiveArtifactsMcpServersForAgent(); Claude/Codebuddy .mcp.json; OpenCode/MiMo env-content; attachAcpSession.mcpServers';
        readonly owner: 'runtime transport';
        readonly note: 'External, run-scoped and live-artifact MCP registrations never become Bundle text.';
    }, {
        readonly id: 'mcp_oauth_credentials';
        readonly classification: 'out_of_band';
        readonly source: 'buildClaudeMcpJson() / buildOpenCodeMcpConfigContent()';
        readonly owner: 'runtime transport';
        readonly note: 'Bearer OAuth injection into .mcp.json or OpenCode/MiMo env-content; ACP currently admits stdio registrations only.';
    }, {
        readonly id: 'runtime_tool_environment';
        readonly classification: 'out_of_band';
        readonly source: 'createOpenDesignToolEnv() / spawnEnvForAgent() including OD_TOOL_TOKEN';
        readonly owner: 'runtime transport';
        readonly note: 'Executable paths, daemon/data coordinates and the scoped tool credential are child environment facts, not Bundle text.';
    }, {
        readonly id: 'runtime_model_options';
        readonly classification: 'out_of_band';
        readonly source: 'RuntimeAgentDef.buildArgs agentOptions / ACP model';
        readonly owner: 'runtime transport';
        readonly note: 'Model, reasoning, service tier and execution profile are launch/session configuration.';
    }, {
        readonly id: 'native_session_resume_identity';
        readonly classification: 'out_of_band';
        readonly source: 'resolveAgentResumeContext()';
        readonly owner: 'runtime transport';
        readonly note: 'Resume handle and stable-prefix cache diagnostics are not task Bundle content.';
    }, {
        readonly id: 'skill_side_files';
        readonly classification: 'out_of_band';
        readonly source: 'materializeFrozenSkillPackage() / RuntimeAgentDef extraAllowedDirs';
        readonly owner: 'Task 03 immutable Skill package';
        readonly note: 'Filesystem package contains the selected Skill body and references at their fixed versions.';
    }, {
        readonly id: 'project_attachment_bytes';
        readonly classification: 'out_of_band';
        readonly source: 'createOdNextRunInputProjection() -> OD_TASK_INPUT_DIR / ACP resource_link';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Canonical bytes are daemon-only; Agent-readable copies live in a per-Run projection and only identity/reference/env-root semantics belong in Bundle text.';
    }, {
        readonly id: 'transport_wrapper_syntax';
        readonly classification: 'excluded';
        readonly source: 'prompt file / argv / stdin / stream-json / Pi RPC / ACP wrappers';
        readonly owner: 'runtime transport';
        readonly note: 'A wrapper may encode the exact text but must not change or be counted as canonical inner text.';
    }, {
        readonly id: 'available_skills_index';
        readonly classification: 'excluded';
        readonly source: 'not produced';
        readonly owner: 'explicit product exclusion';
        readonly note: 'The all-Skills catalogue is intentionally absent from Bundle, Turn, telemetry and tests.';
    }, {
        readonly id: 'stable_prompt_hash';
        readonly classification: 'excluded';
        readonly source: 'hashStableInstructions()';
        readonly owner: 'conversation+agent cache diagnostics';
        readonly note: 'Not task Bundle identity and must never trigger Bundle reconstruction or re-seeding.';
    }];
    readonly semanticRequestFacts: readonly [{
        readonly id: 'prior_transcript';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'buildDaemonPriorTranscript(history, agentId) -> ChatRequest.priorTranscript';
        readonly owner: 'Task 02 transcript/context serializer';
        readonly textTarget: 'context/prior_transcript';
        readonly note: 'Contains only agent-scoped history before the latest user turn; ChatRequest.message remains a legacy transport compatibility field.';
    }, {
        readonly id: 'current_user_turn';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'latestUserPromptFromHistory(history) -> ChatRequest.currentPrompt';
        readonly owner: 'Task 02 user_first_prompt serializer';
        readonly textTarget: 'user_first_prompt';
        readonly note: 'Canonical latest user-authored turn. Property presence, not nullishness, selects this source.';
    }, {
        readonly id: 'headless_message_fallback';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'od run start --message -> ChatRequest.message when currentPrompt is absent';
        readonly owner: 'Task 02 user_first_prompt serializer';
        readonly textTarget: 'user_first_prompt';
        readonly note: 'Compatibility fallback only when currentPrompt is not an own property; explicit null or empty never falls back.';
    }, {
        readonly id: 'stable_context_prompt';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'composeOdNextStrategyStableRequestContextV2() -> odNextStableContextPrompt';
        readonly owner: 'Task 02 context serializer';
        readonly textTarget: 'context/stable_request_context';
        readonly note: 'The production Bundle receives this aggregate separately from the core recipe system prompt.';
    }, {
        readonly id: 'task_config_pending_fact';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'loadOdNextTaskInputSnapshot().taskConfigText';
        readonly owner: 'Task 04 canonical task configuration';
        readonly textTarget: 'task_metadata/task_configuration';
        readonly note: 'Canonical immutable configuration loaded from the task-scoped snapshot manifest.';
    }, {
        readonly id: 'request_input_pending_fact';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'loadOdNextTaskInputSnapshot().requestInputText';
        readonly owner: 'Task 04 immutable request inputs';
        readonly textTarget: 'context/request_input_facts';
        readonly note: 'Immutable attachment identities and controlled transport references are serialized here; attachment identities are additionally projected into task_metadata/attachments.';
    }, {
        readonly id: 'strategy_task_skill';
        readonly classification: 'initial_bundle';
        readonly producer: 'daemon_system_prompt';
        readonly source: 'resolveOdNextStrategyRequestRecipeV2().taskSkill';
        readonly owner: 'Task 02 Bundle head serializer';
        readonly textTarget: 'session_skills/task_type_skill';
        readonly note: 'Pinned Task Skill from the verified strategy package, distinct from user-selected @Skills.';
    }, {
        readonly id: 'strategy_task_type';
        readonly classification: 'initial_bundle';
        readonly producer: 'daemon_system_prompt';
        readonly source: 'AppliedStrategyBindingV2.selectedTaskProfile / resolvedRecipe.taskType';
        readonly owner: 'Task 02 core recipe; Task 04 canonical task configuration';
        readonly textTarget: 'task_metadata/task_type';
        readonly note: 'Selects the verified core recipe and is serialized as the canonical Task 04 task type.';
    }, {
        readonly id: 'request_execution_configuration';
        readonly classification: 'out_of_band';
        readonly producer: 'request';
        readonly source: 'sessionMode, locale, research, mediaExecution, titleGeneration and selected runtime profile';
        readonly owner: 'Task 04 canonical task configuration';
        readonly note: 'The allowlisted stable subset is serialized in task_metadata; research/title/context remain their separately owned Bundle contributors.';
    }, {
        readonly id: 'project_and_design_context';
        readonly classification: 'initial_bundle';
        readonly producer: 'daemon_system_prompt';
        readonly source: 'metadata, template, host-detected deck intent, design-system fields, craftBody/craftSections and memoryBody';
        readonly owner: 'Task 02 context serializer';
        readonly textTarget: 'context/stable_request_context';
        readonly note: 'Stable project/design facts currently nested in composeDaemonSystemPrompt().';
    }, {
        readonly id: 'user_and_project_instructions';
        readonly classification: 'initial_bundle';
        readonly producer: 'daemon_system_prompt';
        readonly source: 'userInstructions + projectInstructions';
        readonly owner: 'Task 02 context serializer';
        readonly textTarget: 'context/stable_request_context';
        readonly note: 'Stable instruction facts currently nested in the daemon system aggregate.';
    }, {
        readonly id: 'run_context_selection';
        readonly classification: 'initial_bundle';
        readonly producer: 'request';
        readonly source: 'ChatRequest.context -> renderRunContextPrompt()';
        readonly owner: 'Task 02 context serializer';
        readonly textTarget: 'context/run_context';
        readonly note: 'Explicit user-selected context facts, separate from transcript history.';
    }, {
        readonly id: 'project_attachment_selection';
        readonly classification: 'out_of_band';
        readonly producer: 'request';
        readonly source: 'ChatRequest.attachments -> createOdNextTaskInputSnapshot()';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Raw and canonical paths stay daemon-only; the Bundle receives logical reference, byte length, media type, digest and the OD_TASK_INPUT_DIR resolver contract.';
    }, {
        readonly id: 'comment_attachment_selection';
        readonly classification: 'out_of_band';
        readonly producer: 'request';
        readonly source: 'ChatRequest.commentAttachments -> normalizeCommentAttachments()';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Raw comment bodies and screenshot paths remain excluded; the Bundle carries only the canonical comment count.';
    }, {
        readonly id: 'image_attachment_selection';
        readonly classification: 'out_of_band';
        readonly producer: 'request';
        readonly source: 'ChatRequest.imagePaths -> createOdNextTaskInputSnapshot()';
        readonly owner: 'Task 04 immutable attachment snapshot';
        readonly note: 'Runtime-native resources use per-Run projection paths out of band; the Bundle carries only logical reference and immutable identity.';
    }, {
        readonly id: 'available_skills_catalogue';
        readonly classification: 'excluded';
        readonly source: 'not produced';
        readonly owner: 'explicit product exclusion';
        readonly note: 'No all-Skills catalogue is serialized or observed.';
    }];
};
export declare const OD_NEXT_EXACT_TEXT_DELIVERY_PATHS_V1: readonly [{
    readonly id: 'prompt_file';
    readonly source: 'preparePromptFileForAgent(def, exactText, run.id)';
    readonly invariant: 'file UTF-8 content equals exactText';
}, {
    readonly id: 'runtime_args';
    readonly source: 'RuntimeAgentDef.buildArgs(exactText, ...)';
    readonly invariant: 'adapter receives exactText; argv/file choice is transport-only';
}, {
    readonly id: 'plain_stdin';
    readonly source: 'spawnAgentProcess({ stdin: { prompt: exactText } }) file-backed stdin';
    readonly invariant: 'stdin bytes are exactText UTF-8';
}, {
    readonly id: 'stream_json_stdin';
    readonly source: 'JSONL user.content[0].text = exactText';
    readonly invariant: 'JSON encoding changes the wire wrapper only; decoded text equals exactText';
}, {
    readonly id: 'pi_rpc';
    readonly source: 'attachPiRpcSession({ prompt: exactText })';
    readonly invariant: 'prompt field equals exactText';
}, {
    readonly id: 'dsh_profile_jsonl';
    readonly source: 'attachDshProfileSession({ prompt: exactText })';
    readonly invariant: 'execute.prompt equals exactText';
}, {
    readonly id: 'acp_json_rpc';
    readonly source: 'attachAcpSession({ prompt: exactText })';
    readonly invariant: 'prompt field equals exactText';
}];
export declare function assertOdNextExactInputMapV1(entries?: readonly OdNextExactInputEntry[]): void;
export declare function assertOdNextSemanticRequestFactProducerCoverage(producer: 'daemon_system_prompt' | 'request', facts: Readonly<Record<string, unknown>>): void;
export declare function assertOdNextLegacyTextContributorCoverage(contributorIds: readonly string[], stage?: OdNextExactInputStage | null): void;
export declare function assertOdNextBundleTextContributorCoverage(contributorIds: readonly string[]): void;
/**
 * Fail-closed boundary witness for the canonical first textual payload: the
 * exact text must be one canonical `open_design_prompt_bundle` v2 tree and
 * nothing else. Delegating to the contract's parser means the witness also
 * rejects a payload that parses but is not in canonical form, so leading or
 * trailing bytes, a second root, and a drifting serializer all fail here.
 */
export declare function assertSingleOdNextPromptBundleRoot(exactText: string): void;
