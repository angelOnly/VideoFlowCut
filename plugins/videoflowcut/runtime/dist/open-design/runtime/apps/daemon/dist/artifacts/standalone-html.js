import { parse } from '@babel/parser';
import { load } from 'cheerio';
import path from 'node:path';
import postcss from 'postcss';
export const MAX_STANDALONE_ENTRY_BYTES = 2 * 1024 * 1024;
export const MAX_STANDALONE_FIRST_LEVEL_CANDIDATES = 500;
export const MAX_STANDALONE_GRAPH_NODES = 2_500;
export const MAX_STANDALONE_ASSET_BYTES = 50 * 1024 * 1024;
// The legacy 50 MiB cap applies after replacing up to a 2 MiB owner document's
// top-level URL tags. Raw graph accounting therefore needs both budgets; using
// only 50 MiB would reject a legacy-successful document whose long src/href is
// removed during assembly.
export const MAX_STANDALONE_RAW_BYTES = 52 * 1024 * 1024;
export const MAX_STANDALONE_OUTPUT_BYTES = 100 * 1024 * 1024;
export class StandaloneHtmlExportError extends Error {
    kind;
    dependency;
    chain;
    limit;
    constructor(message, kind, dependency, chain = [], limit) {
        super(message);
        this.kind = kind;
        this.dependency = dependency;
        this.chain = chain;
        this.limit = limit;
        this.name = 'StandaloneHtmlExportError';
    }
}
const DEFAULT_LIMITS = {
    entryBytes: MAX_STANDALONE_ENTRY_BYTES,
    firstLevelCandidates: MAX_STANDALONE_FIRST_LEVEL_CANDIDATES,
    graphNodes: MAX_STANDALONE_GRAPH_NODES,
    assetBytes: MAX_STANDALONE_ASSET_BYTES,
    rawBytes: MAX_STANDALONE_RAW_BYTES,
    outputBytes: MAX_STANDALONE_OUTPUT_BYTES,
};
const TEXT_JAVASCRIPT_MIME = 'text/javascript';
const PROJECT_MODULE_PREFIX = 'od-project:/';
const IMPORT_RE = /^\s*(?:url\(\s*)?(?:(['"])(.*?)\1|([^\s)'";]+))\s*\)?([\s\S]*)$/u;
const EMBEDDABLE_LINK_RELATIONS = new Set([
    'apple-touch-icon',
    'apple-touch-startup-image',
    'icon',
    'manifest',
    'mask-icon',
    'modulepreload',
    'preload',
]);
export async function bundleStandaloneHtml(options) {
    const limits = { ...DEFAULT_LIMITS, ...options.limits };
    const entryPath = normalizeProjectPath(options.entryPath, [options.entryPath]);
    const entryBytes = Buffer.byteLength(options.html, 'utf8');
    if (entryBytes > limits.entryBytes) {
        throw limitError('entryBytes', entryBytes, limits.entryBytes, [entryPath]);
    }
    const firstLevelCandidates = countLegacyFirstLevelCandidates(options.html);
    if (firstLevelCandidates > limits.firstLevelCandidates) {
        throw limitError('firstLevelCandidates', firstLevelCandidates, limits.firstLevelCandidates, [entryPath]);
    }
    const bundler = new StandaloneBundler(options.readAsset, limits, entryBytes);
    let html = await bundler.bundleDocument(options.html, entryPath, [entryPath]);
    html = bundler.injectExternalDependencyManifest(html, [entryPath]);
    const outputBytes = Buffer.byteLength(html, 'utf8');
    if (outputBytes > limits.outputBytes) {
        throw limitError('outputBytes', outputBytes, limits.outputBytes, [entryPath]);
    }
    return {
        html,
        externalDependencies: [...bundler.externalDependencies].sort(),
    };
}
class StandaloneBundler {
    readAsset;
    limits;
    externalDependencies = new Set();
    assetCache = new Map();
    countedPaths = new Set();
    moduleCode = new Map();
    moduleState = new Map();
    workerUrlCache = new Map();
    documentUrlCache = new Map();
    rawBytes;
    constructor(readAsset, limits, entryBytes) {
        this.readAsset = readAsset;
        this.limits = limits;
        this.rawBytes = entryBytes;
    }
    async bundleDocument(html, ownerPath, chain, documentStack = new Set([ownerPath])) {
        const $ = load(html, { sourceCodeLocationInfo: true });
        const replacements = new ReplacementCollector(html, this.limits.outputBytes, chain);
        const documentOwnerPath = this.effectiveDocumentOwnerPath($, ownerPath, chain);
        const modulePaths = new Set();
        const wholeNodeReplacements = new Set();
        for (const node of $('base[href]').toArray()) {
            pushAttributeRemoval(html, node, 'href', replacements);
        }
        for (const node of $('script').toArray()) {
            const location = node.sourceCodeLocation;
            if (!location?.startTag || !location?.endTag)
                continue;
            const attrs = attributesFor(node);
            const src = attrs.get('src');
            const type = (attrs.get('type') ?? '').trim().toLowerCase();
            const scriptKind = classifyScriptType(type);
            if (src) {
                const resolution = this.resolveReference(documentOwnerPath, src, chain, { allowBare: false });
                if (resolution.kind === 'external') {
                    this.externalDependencies.add(resolution.value);
                    continue;
                }
                if (resolution.kind === 'embedded')
                    continue;
                const local = resolution.value;
                const loaded = await this.load(local.projectPath, [...chain, local.projectPath]);
                const source = loaded.buffer.toString('utf8');
                let body;
                if (scriptKind === 'module') {
                    await this.ensureModule(local.projectPath, [...chain, local.projectPath], modulePaths);
                    body = `import ${JSON.stringify(moduleSpecifier(local.projectPath))};`;
                }
                else if (scriptKind === 'classic') {
                    body = await this.rewriteJavaScript(source, local.projectPath, [...chain, local.projectPath], modulePaths, 'classic');
                }
                else {
                    body = source;
                }
                const inlineStyle = attrs.get('style');
                if (inlineStyle)
                    attrs.set('style', await this.rewriteCssUrls(inlineStyle, documentOwnerPath, chain));
                const externalTiming = scriptKind === 'classic' && (attrs.has('defer') || attrs.has('async'));
                replacements.push({
                    start: location.startOffset,
                    end: location.endOffset,
                    value: externalTiming
                        ? [
                            `<script${renderAttributes(attrs, ['src', 'integrity', 'crossorigin', 'referrerpolicy'])} src="`,
                            this.checkedDataUrl(TEXT_JAVASCRIPT_MIME, Buffer.from(body), [...chain, local.projectPath]),
                            '"></script>',
                        ]
                        : `<script${renderAttributes(attrs, ['src', 'integrity', 'crossorigin', 'referrerpolicy'])}>${escapeScriptBody(body)}</script>`,
                });
                wholeNodeReplacements.add(node);
                continue;
            }
            const bodyStart = location.startTag.endOffset;
            const bodyEnd = location.endTag.startOffset;
            const body = html.slice(bodyStart, bodyEnd);
            if (!body.trim())
                continue;
            if (scriptKind === 'module') {
                const rewritten = await this.rewriteJavaScript(body, documentOwnerPath, chain, modulePaths, 'module');
                replacements.push({ start: bodyStart, end: bodyEnd, value: escapeScriptBody(rewritten) });
            }
            else if (scriptKind === 'classic') {
                const rewritten = await this.rewriteJavaScript(body, documentOwnerPath, chain, modulePaths, 'classic');
                if (rewritten !== body)
                    replacements.push({ start: bodyStart, end: bodyEnd, value: escapeScriptBody(rewritten) });
            }
        }
        for (const node of $('style').toArray()) {
            const location = node.sourceCodeLocation;
            if (!location?.startTag || !location?.endTag)
                continue;
            const bodyStart = location.startTag.endOffset;
            const bodyEnd = location.endTag.startOffset;
            const css = html.slice(bodyStart, bodyEnd);
            replacements.push({
                start: bodyStart,
                end: bodyEnd,
                value: await this.bundleCss(css, documentOwnerPath, chain, new Set()),
            });
        }
        for (const node of $('link').toArray()) {
            const location = node.sourceCodeLocation;
            if (!location)
                continue;
            const attrs = attributesFor(node);
            const href = attrs.get('href');
            if (!href)
                continue;
            const rel = (attrs.get('rel') ?? '').toLowerCase();
            if (/\bstylesheet\b/u.test(rel)) {
                const resolution = this.resolveReference(documentOwnerPath, href, chain, { allowBare: false });
                if (resolution.kind === 'external') {
                    this.externalDependencies.add(resolution.value);
                    continue;
                }
                if (resolution.kind === 'embedded')
                    continue;
                const local = resolution.value;
                const loaded = await this.load(local.projectPath, [...chain, local.projectPath]);
                const css = await this.bundleCss(loaded.buffer.toString('utf8'), local.projectPath, [...chain, local.projectPath], new Set([local.projectPath]));
                const inlineStyle = attrs.get('style');
                if (inlineStyle)
                    attrs.set('style', await this.rewriteCssUrls(inlineStyle, documentOwnerPath, chain));
                if (attrs.has('disabled') || /\balternate\b/u.test(rel)) {
                    attrs.set('href', this.checkedDataUrl('text/css;charset=utf-8', Buffer.from(css), [
                        ...chain,
                        local.projectPath,
                    ]));
                    replacements.push({
                        start: location.startOffset,
                        end: location.endOffset,
                        value: `<link${renderAttributes(attrs, ['integrity', 'crossorigin', 'referrerpolicy'])}>`,
                    });
                    wholeNodeReplacements.add(node);
                    continue;
                }
                const kept = renderAttributes(attrs, ['rel', 'href', 'type', 'integrity', 'crossorigin', 'referrerpolicy']);
                replacements.push({
                    start: location.startOffset,
                    end: location.endOffset,
                    value: `<style data-od-inline-asset="${escapeHtmlAttribute(href)}"${kept}>${escapeStyleBody(css)}</style>`,
                });
                wholeNodeReplacements.add(node);
            }
            else if (hasEmbeddableLinkRelation(rel)) {
                await this.rewriteAttribute(html, node, 'href', documentOwnerPath, chain, replacements);
            }
        }
        const assetAttributes = [
            ['img', ['src', 'data-src']],
            ['source', ['src']],
            ['video', ['src', 'poster']],
            ['audio', ['src']],
            ['track', ['src']],
            ['input', ['src']],
            ['embed', ['src']],
            ['object', ['data']],
            ['image', ['href', 'xlink:href']],
            ['use', ['href', 'xlink:href']],
        ];
        for (const [selector, names] of assetAttributes) {
            for (const node of $(selector).toArray()) {
                for (const name of names) {
                    await this.rewriteAttribute(html, node, name, documentOwnerPath, chain, replacements);
                }
            }
        }
        for (const node of $('[srcset]').toArray()) {
            const attrs = attributesFor(node);
            const srcset = attrs.get('srcset');
            if (!srcset)
                continue;
            const rewritten = await this.rewriteSrcset(srcset, documentOwnerPath, chain);
            pushAttributeReplacement(html, node, 'srcset', rewritten, replacements);
        }
        for (const node of $('[style]').toArray()) {
            if (wholeNodeReplacements.has(node))
                continue;
            const attrs = attributesFor(node);
            const style = attrs.get('style');
            if (!style)
                continue;
            const rewritten = await this.rewriteCssUrls(style, documentOwnerPath, chain);
            pushAttributeReplacement(html, node, 'style', rewritten, replacements);
        }
        for (const node of $('iframe[src]').toArray()) {
            const attrs = attributesFor(node);
            const src = attrs.get('src');
            if (!src)
                continue;
            const resolution = this.resolveReference(documentOwnerPath, src, chain, { allowBare: false });
            if (resolution.kind === 'external') {
                this.externalDependencies.add(resolution.value);
                continue;
            }
            if (resolution.kind === 'embedded')
                continue;
            const local = resolution.value;
            if (documentStack.has(local.projectPath)) {
                throw new StandaloneHtmlExportError(`Iframe dependency cycle: ${[...chain, local.projectPath].join(' -> ')}`, 'dependency-cycle', local.projectPath, [...chain, local.projectPath]);
            }
            const nestedUrl = await this.bundleDocumentUrl(local.projectPath, [...chain, local.projectPath], new Set(documentStack).add(local.projectPath));
            pushAttributeReplacement(html, node, 'src', local.fragment ? `${nestedUrl}${local.fragment}` : nestedUrl, replacements);
        }
        let output = applyReplacements(html, replacements.values);
        if (modulePaths.size > 0)
            output = this.injectImportMap(output, modulePaths, chain);
        return output;
    }
    effectiveDocumentOwnerPath($, ownerPath, chain) {
        const firstBase = $('base[href]').first();
        if (firstBase.length === 0)
            return ownerPath;
        const href = String(firstBase.attr('href') ?? '').trim();
        const { pathname } = splitReference(href);
        if (!pathname)
            return ownerPath;
        if (/^(?:data:|about:|blob:)/iu.test(pathname)
            || /^(?:https?:)?\/\//iu.test(pathname)
            || /^[a-z][a-z0-9+.-]*:/iu.test(pathname)
            || /^\/(?:api|artifacts|frames)(?:\/|$)/u.test(pathname)) {
            throw new StandaloneHtmlExportError(`Document base URL cannot be persisted in standalone HTML: ${href}`, 'unpersistable-url', href, chain);
        }
        let decoded;
        try {
            decoded = decodeURIComponent(pathname);
        }
        catch {
            throw new StandaloneHtmlExportError(`Invalid URL encoding in document base: ${href}`, 'invalid-source', href, chain);
        }
        const joined = decoded.startsWith('/')
            ? decoded.replace(/^\/+/, '')
            : path.posix.join(path.posix.dirname(ownerPath), decoded);
        const basePath = normalizeProjectBasePath(joined, chain);
        const directoryBase = decoded.endsWith('/')
            || decoded === '.'
            || decoded === '..'
            || decoded.endsWith('/.')
            || decoded.endsWith('/..');
        if (!directoryBase)
            return normalizeProjectPath(joined, chain);
        return basePath
            ? path.posix.join(basePath, '__od_standalone_base__.html')
            : '__od_standalone_base__.html';
    }
    injectExternalDependencyManifest(html, chain) {
        const dependencies = [...this.externalDependencies].sort();
        if (dependencies.length === 0)
            return html;
        const json = safeJsonForHtml(dependencies);
        const marker = `<script type="application/json" data-od-external-dependencies>${json}</script>`;
        this.assertOutputBytes(Buffer.byteLength(html, 'utf8') + Buffer.byteLength(marker, 'utf8'), chain);
        return injectIntoHead(html, marker);
    }
    async rewriteAttribute(html, node, name, ownerPath, chain, replacements) {
        const value = attributesFor(node).get(name);
        if (!value)
            return;
        const rewritten = await this.referenceToDataUrl(ownerPath, value, chain);
        if (rewritten !== null && rewritten !== value) {
            pushAttributeReplacement(html, node, name, rewritten, replacements);
        }
    }
    async rewriteSrcset(value, ownerPath, chain) {
        const rewritten = [];
        for (const candidate of parseSrcset(value)) {
            const next = await this.referenceToDataUrl(ownerPath, candidate.url, chain);
            rewritten.push([next ?? candidate.url, candidate.descriptor].filter(Boolean).join(' '));
        }
        return rewritten.join(', ');
    }
    async bundleCss(css, ownerPath, chain, cssStack) {
        let root;
        try {
            root = postcss.parse(css, { from: ownerPath });
        }
        catch (error) {
            throw new StandaloneHtmlExportError(`Could not parse CSS in ${ownerPath}: ${error instanceof Error ? error.message : String(error)}`, 'invalid-source', ownerPath, chain);
        }
        await this.rewriteCssContainer(root, ownerPath, chain, cssStack);
        return root.toString();
    }
    async rewriteCssContainer(container, ownerPath, chain, cssStack) {
        for (const node of [...(container.nodes ?? [])]) {
            if (node.type === 'atrule' && node.name.toLowerCase() === 'import') {
                await this.inlineCssImport(node, ownerPath, chain, cssStack);
                continue;
            }
            if (node.type === 'decl') {
                node.value = await this.rewriteCssUrls(node.value, ownerPath, chain);
            }
            if ('nodes' in node && Array.isArray(node.nodes)) {
                await this.rewriteCssContainer(node, ownerPath, chain, cssStack);
            }
        }
    }
    async inlineCssImport(rule, ownerPath, chain, cssStack) {
        const match = rule.params.match(IMPORT_RE);
        const reference = match?.[2] ?? match?.[3];
        if (!reference)
            return;
        const resolution = this.resolveReference(ownerPath, reference, chain, { allowBare: false });
        if (resolution.kind === 'external') {
            this.externalDependencies.add(resolution.value);
            return;
        }
        if (resolution.kind === 'embedded')
            return;
        const local = resolution.value;
        if (cssStack.has(local.projectPath)) {
            throw new StandaloneHtmlExportError(`CSS import cycle: ${[...chain, local.projectPath].join(' -> ')}`, 'dependency-cycle', local.projectPath, [...chain, local.projectPath]);
        }
        const loaded = await this.load(local.projectPath, [...chain, local.projectPath]);
        const nextStack = new Set(cssStack).add(local.projectPath);
        const imported = postcss.parse(loaded.buffer.toString('utf8'), { from: local.projectPath });
        await this.rewriteCssContainer(imported, local.projectPath, [...chain, local.projectPath], nextStack);
        const tail = (match?.[4] ?? '').trim().replace(/;\s*$/u, '');
        const nodes = imported.nodes.map((node) => node.clone());
        if (!tail) {
            rule.replaceWith(...nodes);
            return;
        }
        rule.replaceWith(wrapImportedCss(nodes, tail));
    }
    async rewriteCssUrls(value, ownerPath, chain) {
        const replacements = [];
        for (const token of findCssUrlFunctions(value)) {
            const reference = token.reference;
            const rewritten = await this.referenceToDataUrl(ownerPath, reference.trim(), chain);
            if (rewritten === null || rewritten === reference)
                continue;
            replacements.push({
                start: token.start,
                end: token.end,
                value: ['url("', escapeCssString(rewritten), '")'],
            });
        }
        return applyReplacements(value, replacements, this.limits.outputBytes, chain);
    }
    async rewriteJavaScript(source, ownerPath, chain, modulePaths, mode, workerStack = new Set()) {
        let ast;
        try {
            ast = parse(source, {
                sourceType: mode === 'classic' ? 'unambiguous' : 'module',
                plugins: ['dynamicImport', 'importAttributes', 'importMeta', 'topLevelAwait'],
            });
        }
        catch (runtimeError) {
            try {
                parse(source, {
                    sourceType: mode === 'classic' ? 'unambiguous' : 'module',
                    plugins: ['dynamicImport', 'importAttributes', 'importMeta', 'jsx', 'topLevelAwait', 'typescript'],
                });
            }
            catch {
                throw new StandaloneHtmlExportError(`Could not parse JavaScript in ${ownerPath}: ${runtimeError instanceof Error ? runtimeError.message : String(runtimeError)}`, 'invalid-source', ownerPath, chain);
            }
            throw new StandaloneHtmlExportError(`TypeScript or JSX source cannot be emitted as browser JavaScript in standalone HTML: ${ownerPath}`, 'invalid-source', ownerPath, chain);
        }
        const replacements = new Map();
        const handledUrlNodes = new Set();
        const visit = async (node, parent = null) => {
            if (!node || typeof node !== 'object' || typeof node.type !== 'string')
                return;
            const sourceNode = importSourceNode(node);
            if (sourceNode && typeof sourceNode.value === 'string') {
                const resolution = this.resolveReference(ownerPath, sourceNode.value, chain, { allowBare: true });
                if (resolution.kind === 'external') {
                    this.externalDependencies.add(resolution.value);
                }
                else if (resolution.kind === 'local') {
                    const local = resolution.value;
                    if (mode === 'worker') {
                        const workerUrl = await this.bundleWorkerModule(local.projectPath, [...chain, local.projectPath], workerStack);
                        setNodeReplacement(sourceNode, JSON.stringify(workerUrl), replacements);
                    }
                    else {
                        await this.ensureModule(local.projectPath, [...chain, local.projectPath], modulePaths);
                        setNodeReplacement(sourceNode, JSON.stringify(moduleSpecifier(local.projectPath)), replacements);
                    }
                }
            }
            if (isWorkerUrlExpression(node)) {
                const urlNode = node.arguments?.[0];
                const literal = urlNode?.arguments?.[0];
                if (literal && typeof literal.value === 'string') {
                    const resolution = this.resolveReference(ownerPath, literal.value, chain, { allowBare: false });
                    if (resolution.kind === 'external')
                        this.externalDependencies.add(resolution.value);
                    if (resolution.kind === 'local') {
                        const local = resolution.value;
                        const workerUrl = await this.bundleWorkerModule(local.projectPath, [...chain, local.projectPath], new Set(workerStack));
                        setNodeReplacement(urlNode, JSON.stringify(workerUrl), replacements);
                        handledUrlNodes.add(urlNode);
                    }
                }
            }
            if (isWorkerLiteralExpression(node)) {
                const literal = node.arguments?.[0];
                const resolution = this.resolveReference(ownerPath, literal.value, chain, { allowBare: false });
                if (resolution.kind === 'external')
                    this.externalDependencies.add(resolution.value);
                if (resolution.kind === 'local') {
                    const local = resolution.value;
                    const workerUrl = await this.bundleWorkerModule(local.projectPath, [...chain, local.projectPath], new Set(workerStack));
                    setNodeReplacement(literal, JSON.stringify(workerUrl), replacements);
                }
            }
            if (isImportScriptsCall(node)) {
                for (const literal of node.arguments) {
                    if (typeof literal?.value !== 'string')
                        continue;
                    const resolution = this.resolveReference(ownerPath, literal.value, chain, { allowBare: false });
                    if (resolution.kind === 'external')
                        this.externalDependencies.add(resolution.value);
                    if (resolution.kind === 'local') {
                        const local = resolution.value;
                        const workerUrl = await this.bundleWorkerModule(local.projectPath, [...chain, local.projectPath], new Set(workerStack));
                        setNodeReplacement(literal, JSON.stringify(workerUrl), replacements);
                    }
                }
            }
            if (isImportMetaUrlExpression(node) && !handledUrlNodes.has(node)) {
                const literal = node.arguments?.[0];
                if (literal && typeof literal.value === 'string') {
                    const rewritten = await this.referenceToDataUrl(ownerPath, literal.value, chain);
                    if (rewritten !== null)
                        setNodeReplacement(literal, JSON.stringify(rewritten), replacements);
                }
            }
            if (isFetchLiteral(node)) {
                const literal = node.arguments?.[0];
                const rewritten = await this.referenceToDataUrl(ownerPath, literal.value, chain);
                if (rewritten !== null)
                    setNodeReplacement(literal, JSON.stringify(rewritten), replacements);
            }
            for (const [key, child] of Object.entries(node)) {
                if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra')
                    continue;
                if (Array.isArray(child)) {
                    for (const item of child)
                        await visit(item, node);
                }
                else if (child && typeof child === 'object' && child !== parent) {
                    await visit(child, node);
                }
            }
        };
        await visit(ast.program);
        return applyReplacements(source, [...replacements.values()], this.limits.outputBytes, chain);
    }
    async ensureModule(projectPath, chain, modulePaths) {
        modulePaths.add(projectPath);
        const state = this.moduleState.get(projectPath);
        if (state === 'complete' || state === 'processing')
            return;
        this.moduleState.set(projectPath, 'processing');
        const loaded = await this.load(projectPath, chain);
        const code = await this.rewriteJavaScript(loaded.buffer.toString('utf8'), projectPath, chain, modulePaths, 'module');
        this.moduleCode.set(projectPath, code);
        this.moduleState.set(projectPath, 'complete');
    }
    async bundleWorkerModule(projectPath, chain, stack) {
        if (stack.has(projectPath)) {
            throw new StandaloneHtmlExportError(`Worker module cycle: ${[...chain, projectPath].join(' -> ')}`, 'dependency-cycle', projectPath, [...chain, projectPath]);
        }
        const cached = this.workerUrlCache.get(projectPath);
        if (cached)
            return cached;
        const nextStack = new Set(stack).add(projectPath);
        const pending = (async () => {
            const loaded = await this.load(projectPath, chain);
            const code = await this.rewriteJavaScript(loaded.buffer.toString('utf8'), projectPath, chain, new Set(), 'worker', nextStack);
            return this.checkedDataUrl(TEXT_JAVASCRIPT_MIME, Buffer.from(code), chain);
        })();
        this.workerUrlCache.set(projectPath, pending);
        return pending;
    }
    injectImportMap(html, paths, chain) {
        const imports = {};
        for (const projectPath of [...paths].sort()) {
            const code = this.moduleCode.get(projectPath);
            if (code === undefined)
                continue;
            imports[moduleSpecifier(projectPath)] = this.checkedDataUrl(TEXT_JAVASCRIPT_MIME, Buffer.from(code), [...chain, projectPath]);
        }
        const tag = `<script type="importmap">${safeJsonForHtml({ imports })}</script>`;
        this.assertOutputBytes(Buffer.byteLength(html, 'utf8') + Buffer.byteLength(tag, 'utf8'), chain);
        return injectIntoHead(html, tag);
    }
    async referenceToDataUrl(ownerPath, reference, chain) {
        const resolution = this.resolveReference(ownerPath, reference, chain, { allowBare: false });
        if (resolution.kind === 'embedded')
            return reference;
        if (resolution.kind === 'external') {
            this.externalDependencies.add(resolution.value);
            return null;
        }
        const local = resolution.value;
        const loaded = await this.load(local.projectPath, [...chain, local.projectPath]);
        loaded.dataUrl ??= this.checkedDataUrl(loaded.mime, loaded.buffer, [...chain, local.projectPath]);
        return local.fragment ? `${loaded.dataUrl}${local.fragment}` : loaded.dataUrl;
    }
    async bundleDocumentUrl(projectPath, chain, documentStack) {
        const cached = this.documentUrlCache.get(projectPath);
        if (cached)
            return cached;
        const pending = (async () => {
            const loaded = await this.load(projectPath, chain);
            if (!isHtmlMimeType(loaded.mime)) {
                loaded.dataUrl ??= this.checkedDataUrl(loaded.mime, loaded.buffer, chain);
                return loaded.dataUrl;
            }
            const nested = await this.bundleDocument(loaded.buffer.toString('utf8'), projectPath, chain, documentStack);
            return this.checkedDataUrl('text/html;charset=utf-8', Buffer.from(nested), chain);
        })();
        this.documentUrlCache.set(projectPath, pending);
        return pending;
    }
    checkedDataUrl(mime, buffer, chain) {
        const normalizedMime = mime.split(';')[0]?.trim() || 'application/octet-stream';
        const encodedBytes = Buffer.byteLength(`data:${normalizedMime};base64,`, 'utf8')
            + 4 * Math.ceil(buffer.length / 3);
        this.assertOutputBytes(encodedBytes, chain);
        return dataUrl(normalizedMime, buffer);
    }
    assertOutputBytes(bytes, chain) {
        if (bytes > this.limits.outputBytes) {
            throw limitError('outputBytes', bytes, this.limits.outputBytes, chain);
        }
    }
    resolveReference(ownerPath, reference, chain, options) {
        const trimmed = reference.trim();
        if (!trimmed || trimmed.startsWith('#') || /^(?:data:|about:)/iu.test(trimmed)) {
            return { kind: 'embedded' };
        }
        if (/^blob:/iu.test(trimmed)) {
            throw new StandaloneHtmlExportError(`Blob URL cannot be persisted in standalone HTML: ${trimmed}`, 'unpersistable-url', trimmed, chain);
        }
        if (/^(?:https?:)?\/\//iu.test(trimmed) || /^[a-z][a-z0-9+.-]*:/iu.test(trimmed)) {
            return { kind: 'external', value: trimmed };
        }
        if (/^\/(?:api|artifacts|frames)\//u.test(trimmed)) {
            return { kind: 'external', value: trimmed };
        }
        const { pathname, fragment } = splitReference(trimmed);
        if (options.allowBare && !pathname.startsWith('.') && !pathname.startsWith('/')) {
            return { kind: 'external', value: trimmed };
        }
        let decoded;
        try {
            decoded = decodeURIComponent(pathname);
        }
        catch {
            throw new StandaloneHtmlExportError(`Invalid URL encoding in dependency: ${trimmed}`, 'invalid-source', trimmed, chain);
        }
        const joined = pathname.startsWith('/')
            ? decoded.replace(/^\/+/, '')
            : path.posix.join(path.posix.dirname(ownerPath), decoded);
        const projectPath = normalizeProjectPath(joined, chain);
        return { kind: 'local', value: { projectPath, fragment } };
    }
    async load(projectPath, chain) {
        const existing = this.assetCache.get(projectPath);
        if (existing)
            return existing;
        if (!this.countedPaths.has(projectPath) && this.countedPaths.size >= this.limits.graphNodes) {
            throw limitError('graphNodes', this.countedPaths.size + 1, this.limits.graphNodes, chain);
        }
        this.countedPaths.add(projectPath);
        const pending = (async () => {
            const handle = await this.readAsset(projectPath);
            if (!handle) {
                throw new StandaloneHtmlExportError(`Missing local dependency: ${chain.join(' -> ')}`, 'missing-local-dependency', projectPath, chain);
            }
            if (handle.size > this.limits.assetBytes) {
                throw limitError('assetBytes', handle.size, this.limits.assetBytes, chain, projectPath);
            }
            if (this.rawBytes + handle.size > this.limits.rawBytes) {
                throw limitError('rawBytes', this.rawBytes + handle.size, this.limits.rawBytes, chain, projectPath);
            }
            this.rawBytes += handle.size;
            let buffer;
            try {
                buffer = handle.buffer ?? await handle.read?.() ?? Buffer.alloc(0);
            }
            catch (error) {
                throw new StandaloneHtmlExportError(`Could not read local dependency ${projectPath}: ${error instanceof Error ? error.message : String(error)}`, 'missing-local-dependency', projectPath, chain);
            }
            if (buffer.length > this.limits.assetBytes) {
                throw limitError('assetBytes', buffer.length, this.limits.assetBytes, chain, projectPath);
            }
            this.rawBytes += buffer.length - handle.size;
            if (this.rawBytes > this.limits.rawBytes) {
                throw limitError('rawBytes', this.rawBytes, this.limits.rawBytes, chain, projectPath);
            }
            return {
                buffer,
                mime: normalizeAssetMime(handle.mime, projectPath),
                size: buffer.length,
            };
        })();
        this.assetCache.set(projectPath, pending);
        return pending;
    }
}
function countLegacyFirstLevelCandidates(html) {
    const $ = load(html);
    const links = $('link[href]').toArray().filter((node) => {
        const rel = attributesFor(node).get('rel') ?? '';
        return /\bstylesheet\b/iu.test(rel);
    }).length;
    const scripts = $('script[src]').length;
    return links + scripts;
}
function normalizeProjectBasePath(value, chain) {
    const normalized = path.posix.normalize(value.replace(/\\/gu, '/')).replace(/^\.\//u, '');
    if (normalized === '.' || normalized === '')
        return '';
    if (normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
        throw new StandaloneHtmlExportError(`Document base path escapes the project root: ${value}`, 'path-outside-project', value, chain);
    }
    return normalized;
}
function normalizeProjectPath(value, chain) {
    const normalized = path.posix.normalize(value.replace(/\\/gu, '/')).replace(/^\.\//u, '');
    if (!normalized || normalized === '.' || normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) {
        throw new StandaloneHtmlExportError(`Dependency path escapes the project root: ${value}`, 'path-outside-project', value, chain);
    }
    return normalized;
}
function splitReference(reference) {
    const query = reference.indexOf('?');
    const hash = reference.indexOf('#');
    const cuts = [query, hash].filter((index) => index >= 0);
    const cut = cuts.length > 0 ? Math.min(...cuts) : reference.length;
    return {
        pathname: reference.slice(0, cut),
        fragment: hash >= 0 ? reference.slice(hash) : '',
    };
}
function parseSrcset(value) {
    const candidates = [];
    let cursor = 0;
    while (cursor < value.length) {
        while (cursor < value.length && /[\s,]/u.test(value[cursor] ?? ''))
            cursor += 1;
        if (cursor >= value.length)
            break;
        const urlStart = cursor;
        const isDataUrl = value.slice(cursor, cursor + 5).toLowerCase() === 'data:';
        while (cursor < value.length
            && !/\s/u.test(value[cursor] ?? '')
            && (isDataUrl || value[cursor] !== ','))
            cursor += 1;
        const url = value.slice(urlStart, cursor);
        while (cursor < value.length && /\s/u.test(value[cursor] ?? ''))
            cursor += 1;
        const descriptorStart = cursor;
        while (cursor < value.length && value[cursor] !== ',')
            cursor += 1;
        const descriptor = value.slice(descriptorStart, cursor).trim();
        if (url)
            candidates.push({ url, descriptor });
        if (value[cursor] === ',')
            cursor += 1;
    }
    return candidates;
}
function classifyScriptType(type) {
    if (type === 'module')
        return 'module';
    if (!type || isJavaScriptMimeType(type))
        return 'classic';
    return 'data';
}
function hasEmbeddableLinkRelation(rel) {
    return rel.split(/\s+/u).some((token) => EMBEDDABLE_LINK_RELATIONS.has(token));
}
function isHtmlMimeType(mime) {
    const essence = mime.split(';', 1)[0]?.trim().toLowerCase() ?? '';
    return essence === 'text/html' || essence === 'application/xhtml+xml';
}
function isJavaScriptMimeType(type) {
    const essence = type.split(';', 1)[0]?.trim() ?? '';
    return /^(?:(?:application|text)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/u
        .test(essence);
}
function findCssUrlFunctions(value) {
    const tokens = [];
    let cursor = 0;
    while (cursor < value.length) {
        const char = value[cursor] ?? '';
        if (char === '/' && value[cursor + 1] === '*') {
            cursor = skipCssComment(value, cursor);
            continue;
        }
        if (char === '"' || char === "'") {
            cursor = skipCssString(value, cursor, char);
            continue;
        }
        if (value.slice(cursor, cursor + 3).toLowerCase() === 'url'
            && !isCssIdentifierChar(value[cursor - 1] ?? '')) {
            const parsed = parseCssUrlFunction(value, cursor);
            if (parsed) {
                tokens.push(parsed);
                cursor = parsed.end;
                continue;
            }
        }
        cursor += 1;
    }
    return tokens;
}
function parseCssUrlFunction(value, start) {
    let cursor = start + 3;
    if (value[cursor] !== '(')
        return null;
    cursor += 1;
    cursor = skipCssSpaceAndComments(value, cursor);
    let reference = '';
    const quote = value[cursor] ?? '';
    if (quote === '"' || quote === "'") {
        const contentStart = cursor + 1;
        const stringEnd = skipCssString(value, cursor, quote);
        if (value[stringEnd - 1] !== quote)
            return null;
        reference = value.slice(contentStart, stringEnd - 1);
        cursor = skipCssSpaceAndComments(value, stringEnd);
    }
    else {
        const contentStart = cursor;
        while (cursor < value.length && value[cursor] !== ')') {
            if (value[cursor] === '\\') {
                cursor = Math.min(value.length, cursor + 2);
                continue;
            }
            if (value[cursor] === '"' || value[cursor] === "'")
                return null;
            cursor += 1;
        }
        reference = value.slice(contentStart, cursor).trim();
    }
    if (value[cursor] !== ')' || !reference)
        return null;
    return { start, end: cursor + 1, reference };
}
function skipCssSpaceAndComments(value, start) {
    let cursor = start;
    while (cursor < value.length) {
        if (/\s/u.test(value[cursor] ?? '')) {
            cursor += 1;
            continue;
        }
        if (value[cursor] === '/' && value[cursor + 1] === '*') {
            cursor = skipCssComment(value, cursor);
            continue;
        }
        break;
    }
    return cursor;
}
function skipCssComment(value, start) {
    const end = value.indexOf('*/', start + 2);
    return end < 0 ? value.length : end + 2;
}
function skipCssString(value, start, quote) {
    let cursor = start + 1;
    while (cursor < value.length) {
        if (value[cursor] === '\\') {
            cursor = Math.min(value.length, cursor + 2);
            continue;
        }
        cursor += 1;
        if (value[cursor - 1] === quote)
            return cursor;
    }
    return cursor;
}
function isCssIdentifierChar(char) {
    return /[\w\u0080-\u{10ffff}-]/u.test(char) || char === '\\';
}
function wrapImportedCss(nodes, tail) {
    let rest = tail.trim();
    let layer;
    let supports;
    if (/^layer\b/iu.test(rest)) {
        rest = rest.slice('layer'.length).trimStart();
        if (rest.startsWith('(')) {
            const consumed = consumeBalancedCss(rest);
            layer = consumed.body.trim();
            rest = consumed.rest.trimStart();
        }
        else {
            layer = null;
        }
    }
    if (/^supports\s*\(/iu.test(rest)) {
        rest = rest.slice(rest.search(/\(/u)).trimStart();
        const consumed = consumeBalancedCss(rest);
        supports = consumed.body.trim();
        rest = consumed.rest.trimStart();
    }
    let wrapped = nodes;
    if (rest)
        wrapped = [wrapCssAtRule('media', rest, wrapped)];
    if (supports !== undefined)
        wrapped = [wrapCssAtRule('supports', `(${supports})`, wrapped)];
    if (layer !== undefined)
        wrapped = [wrapCssAtRule('layer', layer ?? '', wrapped)];
    if (wrapped.length === 1)
        return wrapped[0];
    const container = postcss.atRule({ name: 'media', params: 'all' });
    container.append(...wrapped);
    return container;
}
function wrapCssAtRule(name, params, nodes) {
    const rule = postcss.atRule({ name, params });
    rule.append(...nodes);
    return rule;
}
function consumeBalancedCss(value) {
    if (!value.startsWith('('))
        return { body: '', rest: value };
    let depth = 0;
    let quote = '';
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index] ?? '';
        if (quote) {
            if (char === quote && value[index - 1] !== '\\')
                quote = '';
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === '(')
            depth += 1;
        if (char === ')') {
            depth -= 1;
            if (depth === 0) {
                return { body: value.slice(1, index), rest: value.slice(index + 1) };
            }
        }
    }
    return { body: value.slice(1), rest: '' };
}
function attributesFor(node) {
    return new Map((node.attribs ? Object.entries(node.attribs) : []).map(([name, value]) => [name.toLowerCase(), String(value)]));
}
function renderAttributes(attrs, omitted) {
    const skip = new Set(omitted.map((name) => name.toLowerCase()));
    const rendered = [...attrs.entries()]
        .filter(([name]) => !skip.has(name))
        .map(([name, value]) => value === '' ? name : `${name}="${escapeHtmlAttribute(value)}"`);
    return rendered.length > 0 ? ` ${rendered.join(' ')}` : '';
}
function pushAttributeReplacement(html, node, name, value, replacements) {
    const attrs = node.sourceCodeLocation?.attrs ?? {};
    const location = attrs[name] ?? attrs[name.toLowerCase()];
    if (!location)
        return;
    const raw = html.slice(location.startOffset, location.endOffset);
    const rawName = raw.match(/^\s*([^\s=]+)/u)?.[1] ?? name;
    replacements.push({
        start: location.startOffset,
        end: location.endOffset,
        value: [rawName, '="', escapeHtmlAttribute(value), '"'],
    });
}
function pushAttributeRemoval(html, node, name, replacements) {
    const attrs = node.sourceCodeLocation?.attrs ?? {};
    const location = attrs[name] ?? attrs[name.toLowerCase()];
    if (!location)
        return;
    replacements.push({
        start: location.startOffset,
        end: location.endOffset,
        value: '',
    });
}
class ReplacementCollector {
    source;
    outputLimit;
    chain;
    values = [];
    projectedBytes;
    constructor(source, outputLimit, chain) {
        this.source = source;
        this.outputLimit = outputLimit;
        this.chain = chain;
        this.projectedBytes = Buffer.byteLength(source, 'utf8');
        if (this.projectedBytes > outputLimit) {
            throw limitError('outputBytes', this.projectedBytes, outputLimit, chain);
        }
    }
    push(replacement) {
        const replacedBytes = Buffer.byteLength(this.source.slice(replacement.start, replacement.end), 'utf8');
        const replacementBytes = replacementParts(replacement.value)
            .reduce((total, part) => total + Buffer.byteLength(part, 'utf8'), 0);
        const nextBytes = this.projectedBytes - replacedBytes + replacementBytes;
        if (nextBytes > this.outputLimit) {
            throw limitError('outputBytes', nextBytes, this.outputLimit, this.chain);
        }
        this.projectedBytes = nextBytes;
        this.values.push(replacement);
    }
}
function applyReplacements(source, replacements, outputLimit, chain = []) {
    const sorted = [...replacements]
        .filter((replacement) => replacement.start >= 0 && replacement.end >= replacement.start)
        .sort((a, b) => b.start - a.start || b.end - a.end);
    const accepted = [];
    let lastStart = source.length + 1;
    for (const replacement of sorted) {
        if (replacement.end > lastStart)
            continue;
        accepted.push(replacement);
        lastStart = replacement.start;
    }
    accepted.reverse();
    let outputBytes = Buffer.byteLength(source, 'utf8');
    for (const replacement of accepted) {
        outputBytes -= Buffer.byteLength(source.slice(replacement.start, replacement.end), 'utf8');
        outputBytes += replacementParts(replacement.value)
            .reduce((total, part) => total + Buffer.byteLength(part, 'utf8'), 0);
        if (outputLimit !== undefined && outputBytes > outputLimit) {
            throw limitError('outputBytes', outputBytes, outputLimit, chain);
        }
    }
    const chunks = [];
    let cursor = 0;
    for (const replacement of accepted) {
        chunks.push(source.slice(cursor, replacement.start), ...replacementParts(replacement.value));
        cursor = replacement.end;
    }
    chunks.push(source.slice(cursor));
    return chunks.join('');
}
function replacementParts(value) {
    return typeof value === 'string' ? [value] : value;
}
function dataUrl(mime, buffer, fragment = '') {
    const normalizedMime = mime.split(';')[0]?.trim() || 'application/octet-stream';
    return `data:${normalizedMime};base64,${buffer.toString('base64')}${fragment}`;
}
function normalizeAssetMime(mime, projectPath) {
    const normalized = mime.split(';')[0]?.trim().toLowerCase();
    if (normalized && normalized !== 'application/octet-stream')
        return normalized;
    switch (path.posix.extname(projectPath).toLowerCase()) {
        case '.woff2': return 'font/woff2';
        case '.woff': return 'font/woff';
        case '.ttf': return 'font/ttf';
        case '.otf': return 'font/otf';
        case '.svg': return 'image/svg+xml';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.webp': return 'image/webp';
        default: return normalized || 'application/octet-stream';
    }
}
function moduleSpecifier(projectPath) {
    return `${PROJECT_MODULE_PREFIX}${projectPath}`;
}
function importSourceNode(node) {
    if (node.type === 'ImportDeclaration'
        || node.type === 'ExportAllDeclaration'
        || node.type === 'ExportNamedDeclaration')
        return node.source ?? null;
    if (node.type === 'CallExpression' && node.callee?.type === 'Import')
        return node.arguments?.[0] ?? null;
    if (node.type === 'ImportExpression')
        return node.source ?? null;
    return null;
}
function setNodeReplacement(node, value, replacements) {
    if (!Number.isInteger(node?.start) || !Number.isInteger(node?.end))
        return;
    replacements.set(`${node.start}:${node.end}`, { start: node.start, end: node.end, value });
}
function isImportMetaUrlExpression(node) {
    return node?.type === 'NewExpression'
        && node.callee?.type === 'Identifier'
        && node.callee.name === 'URL'
        && typeof node.arguments?.[0]?.value === 'string'
        && node.arguments?.[1]?.type === 'MemberExpression'
        && node.arguments[1].object?.type === 'MetaProperty'
        && node.arguments[1].object.meta?.name === 'import'
        && node.arguments[1].object.property?.name === 'meta'
        && node.arguments[1].property?.name === 'url';
}
function isWorkerUrlExpression(node) {
    return node?.type === 'NewExpression'
        && node.callee?.type === 'Identifier'
        && (node.callee.name === 'Worker' || node.callee.name === 'SharedWorker')
        && isImportMetaUrlExpression(node.arguments?.[0]);
}
function isWorkerLiteralExpression(node) {
    return node?.type === 'NewExpression'
        && node.callee?.type === 'Identifier'
        && (node.callee.name === 'Worker' || node.callee.name === 'SharedWorker')
        && typeof node.arguments?.[0]?.value === 'string';
}
function isImportScriptsCall(node) {
    return node?.type === 'CallExpression'
        && node.callee?.type === 'Identifier'
        && node.callee.name === 'importScripts'
        && Array.isArray(node.arguments);
}
function isFetchLiteral(node) {
    return node?.type === 'CallExpression'
        && node.callee?.type === 'Identifier'
        && node.callee.name === 'fetch'
        && typeof node.arguments?.[0]?.value === 'string';
}
function injectIntoHead(html, tag) {
    const head = /<head\b[^>]*>/iu;
    if (head.test(html))
        return html.replace(head, (match) => `${match}${tag}`);
    const htmlTag = /<html\b[^>]*>/iu;
    if (htmlTag.test(html))
        return html.replace(htmlTag, (match) => `${match}<head>${tag}</head>`);
    return `${tag}${html}`;
}
function safeJsonForHtml(value) {
    return JSON.stringify(value).replace(/</gu, '\\u003c').replace(/<\/script/giu, '<\\/script');
}
function escapeHtmlAttribute(value) {
    return value
        .replace(/&/gu, '&amp;')
        .replace(/"/gu, '&quot;')
        .replace(/</gu, '&lt;')
        .replace(/>/gu, '&gt;');
}
function escapeCssString(value) {
    return value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"').replace(/\n/gu, '\\a ');
}
function escapeStyleBody(value) {
    return value.replace(/<\/style/giu, '<\\/style');
}
function escapeScriptBody(value) {
    return value.replace(/<\/script/giu, '<\\/script');
}
function limitError(limit, actual, maximum, chain, dependency) {
    return new StandaloneHtmlExportError(`Standalone HTML ${limit} limit exceeded (${actual} > ${maximum})`, 'limit-exceeded', dependency, chain, limit);
}
//# sourceMappingURL=standalone-html.js.map