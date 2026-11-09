// Offline `.fig` import orchestrator.
//
// Ties the offline decoder (`fig-decode.ts`) to the shared REST-path helpers
// (`walkNode` + `liftTokens`) so an uploaded `.fig` produces the exact same
// `figma/` snapshot the OAuth `figma-extract` atom writes — plus a thumbnail
// and an agent-facing `DESIGN-context.md` inventory. Everything downstream
// (design-system generation, the chat reshape run, `token-map`) consumes that
// one snapshot.
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { walkNode, liftTokens, } from '../plugins/atoms/figma-extract.js';
import { decodeFigFile } from './fig-decode.js';
const DEFAULT_SUBDIR = 'figma';
const DEFAULT_ASSET_MAX = 12 * 1024 * 1024;
const MAX_CONTEXT_COLORS = 24;
const MAX_CONTEXT_COMPONENTS = 30;
/**
 * Decode `.fig` bytes fully offline and write the canonical snapshot.
 * Never throws on a partially-decodable file — it degrades to the assets
 * the ZIP layer recovered and reports that in `inventory.decoded`.
 */
export async function importFigmaFromBytes(bytes, opts) {
    const cwd = path.resolve(opts.cwd);
    const subdir = opts.subdir ?? DEFAULT_SUBDIR;
    const label = opts.label ?? 'figma-import';
    const assetMaxBytes = opts.assetMaxBytes ?? DEFAULT_ASSET_MAX;
    const decoded = await decodeFigFile(bytes);
    // Flatten the rebuilt document with the shared walker so the offline tree
    // and the REST tree are byte-for-byte the same shape on disk.
    const tree = [];
    const unsupported = [];
    if (decoded.document) {
        walkNode(decoded.document, undefined, tree, unsupported);
    }
    const tokens = liftTokens(tree);
    const figmaDir = path.join(cwd, subdir);
    const assetsDir = path.join(figmaDir, 'assets');
    await fsp.mkdir(assetsDir, { recursive: true });
    const written = [];
    const rel = (abs) => path.relative(cwd, abs).split(path.sep).join('/');
    await writeJson(path.join(figmaDir, 'tree.json'), tree);
    written.push(rel(path.join(figmaDir, 'tree.json')));
    await writeJson(path.join(figmaDir, 'tokens.json'), tokens);
    written.push(rel(path.join(figmaDir, 'tokens.json')));
    // Embedded assets (the ZIP `images/` blobs). Even unreferenced ones are
    // useful to the agent, so we lift them all up to the cap.
    let assetCount = 0;
    for (const [hash, data] of decoded.images) {
        if (data.byteLength > assetMaxBytes)
            continue;
        const ext = detectImageExt(data);
        const safe = hash.replace(/[^a-z0-9]+/gi, '').slice(0, 64) || `asset-${assetCount}`;
        const file = path.join(assetsDir, `${safe}.${ext}`);
        await fsp.writeFile(file, data);
        written.push(rel(file));
        assetCount += 1;
    }
    let thumbnailPath;
    if (decoded.thumbnail) {
        const file = path.join(figmaDir, 'thumbnail.png');
        await fsp.writeFile(file, decoded.thumbnail);
        thumbnailPath = rel(file);
        written.push(thumbnailPath);
    }
    const inventory = buildInventory(decoded, tree, tokens, assetCount);
    const contextMd = renderDesignContext({ label, inventory, tree, tokens, thumbnailPath, notes: opts.notes });
    const contextFile = path.join(figmaDir, 'DESIGN-context.md');
    await fsp.writeFile(contextFile, contextMd, 'utf8');
    const contextPath = rel(contextFile);
    written.push(contextPath);
    const meta = {
        source: 'offline-fig',
        label,
        decoded: decoded.decoded,
        container: decoded.source,
        nodeCount: decoded.nodeCount,
        assetCount,
        hasThumbnail: Boolean(thumbnailPath),
        fonts: decoded.fonts,
        unsupportedNodes: unsupported,
        warnings: decoded.warnings,
        figMeta: decoded.meta ?? null,
        exportedAt: new Date().toISOString(),
    };
    await writeJson(path.join(figmaDir, 'meta.json'), meta);
    written.push(rel(path.join(figmaDir, 'meta.json')));
    const result = {
        snapshotDir: rel(figmaDir),
        files: written,
        inventory,
        contextPath,
        suggestedPrompt: buildSuggestedPrompt(label, inventory, contextPath, thumbnailPath, opts.notes),
        label,
    };
    if (thumbnailPath)
        result.thumbnailPath = thumbnailPath;
    return result;
}
// ---------------------------------------------------------------------------
// Inventory + context rendering
// ---------------------------------------------------------------------------
function buildInventory(decoded, tree, tokens, assetCount) {
    let pageCount = 0;
    let frameCount = 0;
    let componentCount = 0;
    for (const node of tree) {
        if (node.type === 'CANVAS')
            pageCount += 1;
        else if (node.type === 'FRAME')
            frameCount += 1;
        else if (node.type === 'COMPONENT' || node.type === 'INSTANCE')
            componentCount += 1;
    }
    const colors = tokens.colors.map((c) => c.value).slice(0, MAX_CONTEXT_COLORS);
    return {
        decoded: decoded.decoded,
        source: 'fig-file',
        nodeCount: decoded.nodeCount,
        pageCount,
        frameCount,
        componentCount,
        colors,
        fonts: decoded.fonts,
        assetCount,
        hasThumbnail: Boolean(decoded.thumbnail),
        warnings: decoded.warnings,
    };
}
const COMPONENT_NAME_RE = /(button|card|modal|dialog|input|nav|tab|menu|toast|badge|avatar|table|list|toolbar|sidebar|header|footer|chip|tooltip|dropdown|accordion|banner|hero|form|field)/i;
function renderDesignContext(args) {
    const { label, inventory, tree, tokens, thumbnailPath, notes } = args;
    const componentNames = Array.from(new Set(tree.filter((n) => COMPONENT_NAME_RE.test(n.name)).map((n) => n.name.trim()))).slice(0, MAX_CONTEXT_COMPONENTS);
    const fonts = inventory.fonts.map((f) => `- ${f.family} — ${f.styles.join(', ')}`);
    const colors = tokens.colors.slice(0, MAX_CONTEXT_COLORS).map((c) => `- \`${c.value}\`${c.name ? ` — ${c.name}` : ''}`);
    const lines = [
        `# Figma import: ${label}`,
        '',
        inventory.decoded
            ? 'Decoded fully offline from the `.fig` (no Figma account). This is the binding visual contract for anything built from it — use the real tokens, type, spacing, and assets below rather than re-inventing them.'
            : 'Only the embedded assets and preview could be recovered from this `.fig` (the node tree did not decode). Build from the thumbnail and assets, and ask for a fresh export or a screenshot if more fidelity is needed.',
        '',
        '## Snapshot',
        '',
        `- Tree: \`figma/tree.json\` (${inventory.nodeCount} nodes)`,
        `- Tokens: \`figma/tokens.json\``,
        `- Assets: \`figma/assets/\` (${inventory.assetCount} files)`,
        thumbnailPath ? `- Preview: \`${thumbnailPath}\` — treat as visual ground truth` : '- Preview: none shipped in this file',
        '',
        '## Inventory',
        '',
        `- Pages: ${inventory.pageCount}`,
        `- Frames: ${inventory.frameCount}`,
        `- Components / instances: ${inventory.componentCount}`,
        '',
        '## Components (by name)',
        '',
        componentNames.length ? componentNames.map((n) => `- ${n}`).join('\n') : '_No obvious component-named layers found._',
        '',
        '## Color tokens',
        '',
        colors.length ? colors.join('\n') : '_No color tokens lifted._',
        '',
        '## Type',
        '',
        fonts.length ? fonts.join('\n') : '_No fonts referenced._',
        '',
    ];
    if (inventory.warnings.length) {
        lines.push('## Decode notes', '', ...inventory.warnings.map((w) => `- ${w}`), '');
    }
    if (notes && notes.trim()) {
        lines.push('## Author notes', '', notes.trim(), '');
    }
    return lines.join('\n');
}
function buildSuggestedPrompt(label, inventory, contextPath, thumbnailPath, notes) {
    const parts = [
        `I imported the Figma file "${label}". The decoded design snapshot is in \`${path.dirname(contextPath)}/\` — read \`${contextPath}\` first for the inventory, tokens, and components.`,
        thumbnailPath
            ? `Use \`${thumbnailPath}\` as the visual ground truth and \`figma/assets/\` for any embedded logos/icons (don't redraw them).`
            : '',
        inventory.decoded
            ? 'Build a clean, responsive webpage that reproduces this design, binding every screen to the real tokens, type, and spacing from `figma/tokens.json` — semantic HTML, not absolute-positioned layers.'
            : 'The node tree did not fully decode; rebuild the page from the preview and assets, matching the colors and type you can see.',
    ];
    if (notes && notes.trim())
        parts.push(`Author notes: ${notes.trim()}`);
    return parts.filter(Boolean).join(' ');
}
// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
async function writeJson(file, value) {
    await fsp.writeFile(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function detectImageExt(bytes) {
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
        return 'png';
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
        return 'jpg';
    if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)
        return 'gif';
    if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)
        return 'webp';
    // SVG / XML text starts with '<' (optionally a BOM/whitespace).
    for (let i = 0; i < Math.min(bytes.length, 8); i++) {
        const c = bytes[i];
        if (c === 0x3c)
            return 'svg';
        if (c !== 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d && c !== 0xef && c !== 0xbb && c !== 0xbf)
            break;
    }
    return 'bin';
}
//# sourceMappingURL=figma-import.js.map