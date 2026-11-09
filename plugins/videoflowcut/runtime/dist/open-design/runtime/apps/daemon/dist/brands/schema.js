export const ASSET_KINDS = ['landing', 'deck', 'poster', 'email', 'newsletter', 'form'];
const SEED_FIELD_TYPES = {
    colorPrimary: 'string',
    colorSuccess: 'string',
    colorWarning: 'string',
    colorError: 'string',
    colorInfo: 'string',
    colorLink: 'string',
    colorTextBase: 'string',
    colorBgBase: 'string',
    fontFamily: 'string',
    fontFamilyCode: 'string',
    fontSize: 'number',
    borderRadius: 'number',
    sizeUnit: 'number',
    sizeStep: 'number',
    controlHeight: 'number',
    lineWidth: 'number',
    motionUnit: 'number',
    motionBase: 'number',
    wireframe: 'boolean',
    motion: 'boolean',
};
export function sanitizeSeedOverrides(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const input = raw;
    const out = {};
    for (const [key, expected] of Object.entries(SEED_FIELD_TYPES)) {
        const value = input[key];
        if (value === undefined || typeof value !== expected)
            continue;
        if (expected === 'number' && !Number.isFinite(value))
            continue;
        out[key] = value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
//# sourceMappingURL=schema.js.map