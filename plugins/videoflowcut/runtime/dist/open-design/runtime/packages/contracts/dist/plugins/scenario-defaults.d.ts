import type { ProjectKind, ProjectMetadata, ProjectScenarioTaskProfile } from '../api/projects.js';
import type { AppliedPluginSnapshot } from './apply.js';
export type TaskKind = AppliedPluginSnapshot['taskKind'];
export type DefaultScenarioPluginId = 'od-default' | 'od-new-generation' | 'od-media-generation' | 'od-plugin-authoring' | 'od-figma-migration' | 'od-code-migration' | 'od-tune-collab' | 'example-live-artifact' | 'example-hyperframes' | 'example-simple-deck' | 'example-web-clone' | 'example-web-prototype' | 'example-webgl-experience';
export declare const DEFAULT_UNSELECTED_SCENARIO_PLUGIN_ID = "od-default";
/**
 * Resolve the product-owned OD Next route selected by a task-type surface.
 *
 * Keyed by the exact first-level task type, not by broad project kind and not
 * by second-level scene. A second-level scene refines WHAT to build, never
 * WHETHER the parent task type's route applies, so surfaces fold a nested
 * scene onto its parent before asking: `wireframe` and `mobile` are catalog
 * action ids, never route ids, and stay unrouted here on purpose.
 */
export declare function automaticStrategyTaskProfileForRouteId(routeId: string | null | undefined): ProjectScenarioTaskProfile | null;
/**
 * Re-derive the OD Next route from exact project metadata alone.
 *
 * This is the fail-closed half of the routing contract: the web hand-off and
 * the daemon both run it against the metadata a create actually carries, so a
 * claimed route survives only when the metadata independently describes the
 * same OD Next task.
 *
 * `intent` is the only field that can move a project OFF a route, because it
 * is the only one that names a different pipeline (`web-clone`,
 * `live-artifact`, `webgl-experience`, `document`, …); the two intents that own
 * their own route are admitted explicitly and every other intent is unrouted.
 *
 * A second-level scene deliberately does NOT narrow the route. `fidelity` and
 * `platformTargets` describe WHAT a Prototype should be — the Prototype task
 * profile already branches on wireframe/lo-fi fidelity and on mobile platform
 * targets — so the Wireframe and Mobile scenes ride the Prototype route with
 * their refinements intact. They stay in the parameter type to record that the
 * route decision has seen them and chosen not to gate on them.
 */
export declare function automaticStrategyTaskProfileForProjectMetadata(metadata: Pick<ProjectMetadata, 'kind' | 'intent' | 'fidelity' | 'platform' | 'platformTargets'> | null | undefined): ProjectScenarioTaskProfile | null;
export declare const DEFAULT_SCENARIO_PLUGIN_BY_KIND: Record<ProjectKind, DefaultScenarioPluginId>;
export declare const DEFAULT_SCENARIO_PLUGIN_BY_TASK_KIND: Record<TaskKind, DefaultScenarioPluginId>;
export declare function defaultScenarioPluginIdForKind(kind: ProjectKind | undefined): DefaultScenarioPluginId | null;
export declare function defaultScenarioPluginIdForProjectMetadata(metadata: Pick<ProjectMetadata, 'kind' | 'intent'> | null | undefined): DefaultScenarioPluginId | null;
/**
 * Return the only OD Next profile an exact daemon-owned automatic binding may
 * carry. Broad kinds such as `image` and `video` deliberately resolve to no
 * profile unless the product metadata names an approved route.
 */
export declare function defaultScenarioTaskProfileForProjectMetadata(metadata: Pick<ProjectMetadata, 'kind' | 'intent' | 'fidelity' | 'platform' | 'platformTargets'> | null | undefined, pluginId: string): ProjectScenarioTaskProfile | null;
export declare function defaultScenarioPluginIdForTaskKind(taskKind: TaskKind | undefined): DefaultScenarioPluginId | null;
//# sourceMappingURL=scenario-defaults.d.ts.map