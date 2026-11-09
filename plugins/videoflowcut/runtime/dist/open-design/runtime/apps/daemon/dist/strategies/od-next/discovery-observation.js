import { DELIVERABLE_SKILL_CATALOG_VERSION, DELIVERABLE_SKILLS } from '@open-design/contracts';
import { singleSkillShellRead } from './skill-shell-read.js';
const observers = new WeakMap();
const MAX_LOADS = 128;
function createObserver() {
    const reads = new Map();
    const ranged = new Set();
    let enabled = false;
    let injected = false;
    let partial = false;
    let skillRoot;
    return {
        push(event) {
            if (!event.data || typeof event.data !== 'object')
                return;
            const data = event.data;
            if (data.type === 'skill_discovery_policy') {
                enabled = true;
                injected ||= data.injected === true;
                if (typeof data.skillRoot === 'string')
                    skillRoot = data.skillRoot.replaceAll('\\', '/');
            }
            if (data.type === 'tool_use' && typeof data.id === 'string') {
                const input = data.input;
                const shellFile = ['Bash', 'exec_command'].includes(String(data.name))
                    ? singleSkillShellRead(input?.command ?? input?.cmd) : undefined;
                const rawFile = shellFile ?? input?.filePath ?? input?.file_path ?? input?.path;
                const file = typeof rawFile === 'string' ? rawFile.replaceAll('\\', '/') : undefined;
                const match = file ? /\/od-next-strategy\/assets\/task-profiles\/([a-z-]+)\.md$/.exec(file) : null;
                const skill = DELIVERABLE_SKILLS.find((candidate) => candidate.id === match?.[1]);
                if (skill && skillRoot && file === `${skillRoot}/${skill.id}.md` && (shellFile || ['Read', 'read', 'read_file', 'read_text_file'].includes(String(data.name)))) {
                    if (reads.size >= MAX_LOADS && !reads.has(data.id)) {
                        partial = true;
                        return;
                    }
                    if (!reads.has(data.id))
                        reads.set(data.id, { skill_id: skill.id, version: skill.version,
                            tool_use_id: data.id, source: shellFile ? 'shell_read' : 'file_read', status: 'requested' });
                    if (input?.offset !== undefined || input?.limit !== undefined || input?.start_line !== undefined || input?.end_line !== undefined)
                        ranged.add(data.id);
                }
                else if (JSON.stringify(input ?? {}).includes('/task-profiles/'))
                    partial = true;
            }
            if (data.type === 'tool_result' && typeof data.toolUseId === 'string') {
                const read = reads.get(data.toolUseId);
                if (!read)
                    return;
                read.status = data.isError === true ? 'failed'
                    : typeof data.content !== 'string' || !data.content.trim() || ranged.has(data.toolUseId)
                        ? 'unknown' : 'loaded';
                // Some adapters truncate only the observability copy after a successful
                // native Read. Record that real event, but never claim full body coverage.
                read.content_coverage = read.status === 'loaded' && typeof data.content === 'string'
                    && !/\[truncated\]|output truncated|lines? omitted|\[REDACTED:/i.test(data.content)
                    ? 'complete' : 'unknown';
            }
        },
        metadata() {
            const events = [...reads.values()].map((read) => ({ ...read, status: read.status === 'requested' ? 'unknown' : read.status }));
            return {
                skill_discovery_enabled: enabled,
                skill_discovery_policy_injected: injected,
                skill_discovery_catalog_version: enabled ? DELIVERABLE_SKILL_CATALOG_VERSION : null,
                skill_load_events: events,
                skill_ids_loaded: [...new Set(events.filter((read) => read.status === 'loaded').map((read) => read.skill_id))].sort(),
                skill_ids_provided: [],
                // The marker protocol has no machine-readable selection claim.
                // Read events prove loading, not that a particular artifact was delivered.
                skill_observation_status: partial || events.some((read) => read.status === 'unknown') ? 'partial' : enabled ? 'complete' : 'unavailable',
            };
        },
    };
}
/** Bounded ID-only state survives the runtime's event-ring truncation, without a DB or body copy. */
export function observeDiscoveryEvent(run, event) {
    let observer = observers.get(run);
    if (!observer) {
        observer = createObserver();
        observers.set(run, observer);
    }
    observer.push(event);
}
export function discoveryObservation(events) {
    const observer = createObserver();
    events.forEach((event) => observer.push(event));
    return observer.metadata();
}
/** Task exporters normalize Run objects; keep their bounded live evidence attached. */
export function preserveDiscoveryObservation(source, target) {
    const observer = observers.get(source);
    if (observer)
        observers.set(target, observer);
    return target;
}
export function discoveryObservationForRun(run) {
    const observer = observers.get(run);
    if (!observer)
        return { ...discoveryObservation(run.events), skill_observation_status: 'partial' };
    // Includes terminal diagnostic events emitted after the live stream closed.
    run.events.filter((event) => event.event === 'diagnostic').forEach((event) => observer.push(event));
    return observer.metadata();
}
//# sourceMappingURL=discovery-observation.js.map