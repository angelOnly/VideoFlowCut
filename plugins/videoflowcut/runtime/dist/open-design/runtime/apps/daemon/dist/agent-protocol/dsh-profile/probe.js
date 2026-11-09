/** @module agent-protocol/dsh-profile/probe */
import { parseDshProfileRuntimeFrame } from './frames.js';
export function parseDshProfileProbeOutput(stdout) {
    const lines = stdout.split(/\r?\n/u).filter((line) => line.trim().length > 0);
    if (lines.length !== 1) {
        throw new Error('DeepSeek Harness profile probe must emit exactly one frame.');
    }
    let value;
    try {
        value = JSON.parse(lines[0] ?? '');
    }
    catch {
        throw new Error('DeepSeek Harness profile probe emitted malformed JSON.');
    }
    const frame = parseDshProfileRuntimeFrame(value);
    if (frame.type !== 'probe') {
        throw new Error('DeepSeek Harness profile probe emitted the wrong frame type.');
    }
    return frame;
}
export function parseDshProfileModelsOutput(stdout) {
    const lines = stdout.split(/\r?\n/u).filter((line) => line.trim().length > 0);
    if (lines.length !== 1)
        return null;
    let value;
    try {
        value = JSON.parse(lines[0] ?? '');
    }
    catch {
        return null;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const frame = value;
    if (frame.v !== 1 ||
        frame.type !== 'models' ||
        frame.runtime !== 'open-design' ||
        !Array.isArray(frame.models))
        return null;
    const models = [];
    const seen = new Set();
    for (const candidate of frame.models) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
            return null;
        const model = candidate;
        if (typeof model.provider !== 'string' || model.provider.length === 0 ||
            typeof model.provider_name !== 'string' || model.provider_name.length === 0 ||
            typeof model.id !== 'string' || model.id.length === 0 ||
            typeof model.name !== 'string' || model.name.length === 0)
            return null;
        let reasoningOptions;
        if (model.reasoning_options !== undefined) {
            if (!Array.isArray(model.reasoning_options))
                return null;
            reasoningOptions = [];
            const seenEfforts = new Set();
            for (const candidateEffort of model.reasoning_options) {
                if (!candidateEffort || typeof candidateEffort !== 'object' || Array.isArray(candidateEffort))
                    return null;
                const effort = candidateEffort;
                if (typeof effort.id !== 'string' || effort.id.length === 0 ||
                    typeof effort.name !== 'string' || effort.name.length === 0 ||
                    (effort.default !== undefined && typeof effort.default !== 'boolean'))
                    return null;
                if (seenEfforts.has(effort.id))
                    continue;
                seenEfforts.add(effort.id);
                reasoningOptions.push({
                    id: effort.id,
                    name: effort.name,
                    ...(effort.default === true ? { default: true } : {}),
                });
            }
        }
        const id = `${model.provider}/${model.id}`;
        if (seen.has(id))
            continue;
        seen.add(id);
        models.push({
            provider: model.provider,
            provider_name: model.provider_name,
            id: model.id,
            name: model.name,
            ...(reasoningOptions?.length ? { reasoning_options: reasoningOptions } : {}),
        });
    }
    return models.length > 0 ? models : null;
}
//# sourceMappingURL=probe.js.map