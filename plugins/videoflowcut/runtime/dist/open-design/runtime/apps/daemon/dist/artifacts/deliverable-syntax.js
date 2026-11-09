import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import { load } from 'cheerio';
import { DELIVERABLE_SYNTAX_CHECKER as CONTRACT_DELIVERABLE_SYNTAX_CHECKER, } from '@open-design/contracts';
export const DELIVERABLE_SYNTAX_CHECKER = CONTRACT_DELIVERABLE_SYNTAX_CHECKER;
const DEFAULT_LIMITS = {
    maxFiles: 100,
    maxBytesPerFile: 2 * 1024 * 1024,
    maxTotalBytes: 8 * 1024 * 1024,
};
const HTML_EXTENSIONS = new Set(['.htm', '.html']);
const CODE_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const WEB_EXTENSIONS = new Set([...HTML_EXTENSIONS, ...CODE_EXTENSIONS]);
const FATAL_HTML_PARSE_ERRORS = new Set([
    'eof-before-tag-name',
    'eof-in-cdata',
    'eof-in-comment',
    'eof-in-doctype',
    'eof-in-element-that-can-contain-only-text',
    'eof-in-script-html-comment-like-text',
    'eof-in-tag',
]);
const BASE_PARSER_PLUGINS = [
    'dynamicImport',
    'importAttributes',
    'importMeta',
    'topLevelAwait',
];
function positiveLimit(value, fallback) {
    if (!Number.isFinite(value) || Number(value) <= 0)
        return fallback;
    return Math.max(1, Math.floor(Number(value)));
}
function resolveLimits(input) {
    return {
        maxFiles: positiveLimit(input.limits?.maxFiles, DEFAULT_LIMITS.maxFiles),
        maxBytesPerFile: positiveLimit(input.limits?.maxBytesPerFile, DEFAULT_LIMITS.maxBytesPerFile),
        maxTotalBytes: positiveLimit(input.limits?.maxTotalBytes, DEFAULT_LIMITS.maxTotalBytes),
    };
}
function extensionOf(filePath) {
    return path.extname(filePath.split(/[?#]/u, 1)[0] ?? '').toLowerCase();
}
function isInside(root, candidate) {
    const relative = path.relative(root, candidate);
    return relative === '' || (relative !== '..'
        && !relative.startsWith(`..${path.sep}`)
        && !path.isAbsolute(relative));
}
function portablePath(filePath) {
    return filePath.replaceAll(path.sep, '/');
}
function safeOutsideDisplayPath(filePath) {
    const basename = path.basename(filePath);
    return basename ? `<outside-project>/${basename}` : '<outside-project>';
}
function candidateFor(projectRoot, filePath) {
    const absolutePath = path.isAbsolute(filePath)
        ? path.resolve(filePath)
        : path.resolve(projectRoot, filePath);
    if (!isInside(projectRoot, absolutePath)) {
        return {
            absolutePath: null,
            displayPath: safeOutsideDisplayPath(filePath),
            extension: extensionOf(filePath),
            invalidPath: true,
        };
    }
    return {
        absolutePath,
        displayPath: portablePath(path.relative(projectRoot, absolutePath)),
        extension: extensionOf(absolutePath),
        invalidPath: false,
    };
}
function selectCandidates(input) {
    const projectRoot = path.resolve(input.projectRoot);
    const selected = new Map();
    const add = (filePath) => {
        const candidate = candidateFor(projectRoot, filePath);
        const key = candidate.invalidPath
            ? `outside:${candidate.displayPath}`
            : candidate.displayPath;
        selected.set(key, candidate);
    };
    add(input.entryFile);
    for (const relatedPath of input.relatedPaths ?? []) {
        if (typeof relatedPath !== 'string' || !CODE_EXTENSIONS.has(extensionOf(relatedPath)))
            continue;
        add(relatedPath);
    }
    return [...selected.values()].sort((left, right) => left.displayPath < right.displayPath
        ? -1
        : left.displayPath > right.displayPath
            ? 1
            : 0);
}
function stableCode(prefix, value) {
    const suffix = (value || 'parse_error')
        .replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
        .replace(/[^a-z0-9]+/giu, '_')
        .replace(/^_+|_+$/gu, '')
        .toUpperCase();
    return `${prefix}_${suffix || 'PARSE_ERROR'}`;
}
function genericFileDiagnostic(code, file, message) {
    return {
        code,
        file,
        line: null,
        column: null,
        message,
        source: 'file',
    };
}
function parserPlugins(options) {
    return [
        ...BASE_PARSER_PLUGINS,
        ...(options.jsx ? ['jsx'] : []),
        ...(options.typescript ? ['typescript'] : []),
    ];
}
function parserOptionsForFile(file) {
    return {
        attachComment: false,
        sourceFilename: file.displayPath,
        sourceType: file.extension === '.mjs'
            ? 'module'
            : file.extension === '.cjs'
                ? 'commonjs'
                : 'unambiguous',
        plugins: parserPlugins({
            jsx: file.extension === '.jsx' || file.extension === '.tsx',
            typescript: file.extension === '.ts' || file.extension === '.tsx',
        }),
    };
}
function javascriptDiagnostic(error, file, source) {
    const line = error.loc?.line;
    const column = error.loc?.column;
    if (!Number.isFinite(line) || !Number.isFinite(column))
        return null;
    return {
        code: stableCode('JS', error.reasonCode),
        file,
        line: Number(line),
        column: Number(column) + 1,
        message: error.message,
        source,
    };
}
function parseJavaScript(sourceText, file, source, options) {
    try {
        parse(sourceText, options);
        return {};
    }
    catch (error) {
        if (error instanceof Error) {
            const diagnostic = javascriptDiagnostic(error, file, source);
            if (diagnostic)
                return { syntax: diagnostic };
        }
        return {
            incomplete: genericFileDiagnostic('CHECKER_ERROR', file, 'JavaScript parser could not inspect this source.'),
        };
    }
}
function scriptParserOptions(typeValue, location) {
    const type = typeValue.split(';', 1)[0]?.trim().toLowerCase() ?? '';
    const isNativeJavaScript = !type || /^(?:(?:application|text)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/u
        .test(type);
    const isBabel = type === 'text/babel';
    const isJsx = type === 'text/jsx' || type === 'application/jsx';
    const isTypescript = type === 'text/typescript' || type === 'application/typescript';
    if (type !== 'module' && !isNativeJavaScript && !isBabel && !isJsx && !isTypescript) {
        return null;
    }
    const startTag = location.startTag;
    return {
        attachComment: false,
        sourceType: type === 'module' ? 'module' : isNativeJavaScript ? 'script' : 'unambiguous',
        sourceFilename: 'inline-script',
        plugins: parserPlugins({
            jsx: isBabel || isJsx,
            typescript: isBabel || isTypescript,
        }),
        ...(startTag
            ? {
                startIndex: startTag.endOffset,
                startLine: startTag.endLine,
                startColumn: Math.max(0, startTag.endCol - 1),
            }
            : {}),
    };
}
function inspectHtml(html, file) {
    const syntax = [];
    const incomplete = [];
    try {
        const $ = load(html, {
            sourceCodeLocationInfo: true,
            onParseError(error) {
                if (!FATAL_HTML_PARSE_ERRORS.has(error.code))
                    return;
                syntax.push({
                    code: stableCode('HTML', error.code),
                    file,
                    line: Number.isFinite(error.startLine) ? error.startLine : null,
                    column: Number.isFinite(error.startCol) ? error.startCol : null,
                    message: `HTML parser reported ${error.code}.`,
                    source: 'html',
                });
            },
        });
        for (const node of $('script').toArray()) {
            const script = $(node);
            if (script.attr('src') !== undefined)
                continue;
            const location = node
                .sourceCodeLocation;
            if (!location?.startTag || !location.endTag)
                continue;
            const options = scriptParserOptions(script.attr('type') ?? '', location);
            if (!options)
                continue;
            const body = html.slice(location.startTag.endOffset, location.endTag.startOffset);
            if (!body.trim())
                continue;
            options.sourceFilename = file;
            const result = parseJavaScript(body, file, 'inline_script', options);
            if (result.syntax)
                syntax.push(result.syntax);
            if (result.incomplete)
                incomplete.push(result.incomplete);
        }
    }
    catch {
        incomplete.push(genericFileDiagnostic('CHECKER_ERROR', file, 'HTML parser could not inspect this source.'));
    }
    return { syntax, incomplete };
}
function updateHashWithMarker(hash, file, marker) {
    hash.update(`file\0${file}\0${marker}\0`, 'utf8');
}
function updateHashWithContent(hash, file, content) {
    hash.update(`file\0${file}\0bytes\0${content.byteLength}\0`, 'utf8');
    hash.update(content);
    hash.update('\0');
}
function digest(hash) {
    return `sha256:${hash.digest('hex')}`;
}
/**
 * Conditionally validate the syntax of one canonical Web deliverable.
 *
 * The canonical entry controls applicability. A PDF/DOCX/media delivery is
 * skipped even if its run happened to touch a JS build helper. This function
 * only reads bounded files under `projectRoot`; retry policy belongs to the
 * caller.
 */
export async function checkDeliverableSyntax(input) {
    const entryFile = typeof input.entryFile === 'string' ? input.entryFile.trim() : '';
    if (!entryFile || !WEB_EXTENSIONS.has(extensionOf(entryFile))) {
        return {
            checker: DELIVERABLE_SYNTAX_CHECKER,
            status: 'skipped',
            reason: 'non_web_deliverable',
            candidateHash: null,
            checkedFiles: [],
            diagnostics: [],
        };
    }
    const projectRoot = path.resolve(input.projectRoot);
    const limits = resolveLimits(input);
    const candidates = selectCandidates({ ...input, entryFile });
    const candidateHash = createHash('sha256');
    candidateHash.update(`${DELIVERABLE_SYNTAX_CHECKER}\0`, 'utf8');
    const checkedFiles = [];
    const syntaxDiagnostics = [];
    const incompleteDiagnostics = [];
    if (candidates.length > limits.maxFiles) {
        for (const candidate of candidates) {
            updateHashWithMarker(candidateHash, candidate.displayPath, 'file-limit-exceeded');
        }
        return {
            checker: DELIVERABLE_SYNTAX_CHECKER,
            status: 'incomplete',
            reason: 'limit_exceeded',
            candidateHash: digest(candidateHash),
            checkedFiles,
            diagnostics: [genericFileDiagnostic('FILE_LIMIT_EXCEEDED', candidateFor(projectRoot, entryFile).displayPath, `Candidate contains more than ${limits.maxFiles} syntax-checkable files.`)],
        };
    }
    let projectRootReal;
    try {
        projectRootReal = await fs.realpath(projectRoot);
    }
    catch {
        for (const candidate of candidates) {
            updateHashWithMarker(candidateHash, candidate.displayPath, 'project-root-unreadable');
        }
        return {
            checker: DELIVERABLE_SYNTAX_CHECKER,
            status: 'incomplete',
            reason: 'file_unreadable',
            candidateHash: digest(candidateHash),
            checkedFiles,
            diagnostics: [genericFileDiagnostic('PROJECT_ROOT_UNREADABLE', candidateFor(projectRoot, entryFile).displayPath, 'Project root could not be read.')],
        };
    }
    let totalBytes = 0;
    for (const candidate of candidates) {
        if (candidate.invalidPath || !candidate.absolutePath) {
            updateHashWithMarker(candidateHash, candidate.displayPath, 'outside-project');
            incompleteDiagnostics.push({
                reason: 'path_outside_project',
                diagnostic: genericFileDiagnostic('PATH_OUTSIDE_PROJECT', candidate.displayPath, 'Source path is outside the project root.'),
            });
            continue;
        }
        let realPath;
        let stat;
        try {
            realPath = await fs.realpath(candidate.absolutePath);
            if (!isInside(projectRootReal, realPath)) {
                updateHashWithMarker(candidateHash, candidate.displayPath, 'outside-project-symlink');
                incompleteDiagnostics.push({
                    reason: 'path_outside_project',
                    diagnostic: genericFileDiagnostic('PATH_OUTSIDE_PROJECT', candidate.displayPath, 'Source path resolves outside the project root.'),
                });
                continue;
            }
            stat = await fs.stat(realPath);
            if (!stat.isFile())
                throw new Error('not a file');
        }
        catch {
            updateHashWithMarker(candidateHash, candidate.displayPath, 'unreadable');
            incompleteDiagnostics.push({
                reason: 'file_unreadable',
                diagnostic: genericFileDiagnostic('FILE_UNREADABLE', candidate.displayPath, 'Source file could not be read.'),
            });
            continue;
        }
        if (stat.size > limits.maxBytesPerFile || totalBytes + stat.size > limits.maxTotalBytes) {
            updateHashWithMarker(candidateHash, candidate.displayPath, `too-large:${stat.size}`);
            incompleteDiagnostics.push({
                reason: 'limit_exceeded',
                diagnostic: genericFileDiagnostic('FILE_TOO_LARGE', candidate.displayPath, stat.size > limits.maxBytesPerFile
                    ? `Source file exceeds the ${limits.maxBytesPerFile}-byte per-file limit.`
                    : `Candidate exceeds the ${limits.maxTotalBytes}-byte total limit.`),
            });
            continue;
        }
        let content;
        const contentOverride = input.contentOverrides?.get(candidate.displayPath);
        if (contentOverride !== undefined) {
            content = Buffer.isBuffer(contentOverride)
                ? contentOverride
                : Buffer.from(contentOverride, 'utf8');
        }
        else {
            try {
                content = await fs.readFile(realPath);
            }
            catch {
                updateHashWithMarker(candidateHash, candidate.displayPath, 'unreadable');
                incompleteDiagnostics.push({
                    reason: 'file_unreadable',
                    diagnostic: genericFileDiagnostic('FILE_UNREADABLE', candidate.displayPath, 'Source file could not be read.'),
                });
                continue;
            }
        }
        if (content.byteLength > limits.maxBytesPerFile
            || totalBytes + content.byteLength > limits.maxTotalBytes) {
            updateHashWithMarker(candidateHash, candidate.displayPath, `too-large:${content.byteLength}`);
            incompleteDiagnostics.push({
                reason: 'limit_exceeded',
                diagnostic: genericFileDiagnostic('FILE_TOO_LARGE', candidate.displayPath, content.byteLength > limits.maxBytesPerFile
                    ? `Source file exceeds the ${limits.maxBytesPerFile}-byte per-file limit.`
                    : `Candidate exceeds the ${limits.maxTotalBytes}-byte total limit.`),
            });
            continue;
        }
        totalBytes += content.byteLength;
        updateHashWithContent(candidateHash, candidate.displayPath, content);
        checkedFiles.push(candidate.displayPath);
        const sourceText = content.toString('utf8');
        if (HTML_EXTENSIONS.has(candidate.extension)) {
            const result = inspectHtml(sourceText, candidate.displayPath);
            syntaxDiagnostics.push(...result.syntax);
            incompleteDiagnostics.push(...result.incomplete.map((diagnostic) => ({
                diagnostic,
                reason: 'checker_error',
            })));
        }
        else {
            const result = parseJavaScript(sourceText, candidate.displayPath, 'file', parserOptionsForFile(candidate));
            if (result.syntax)
                syntaxDiagnostics.push(result.syntax);
            if (result.incomplete) {
                incompleteDiagnostics.push({ diagnostic: result.incomplete, reason: 'checker_error' });
            }
        }
    }
    const finalHash = digest(candidateHash);
    if (syntaxDiagnostics.length > 0) {
        return {
            checker: DELIVERABLE_SYNTAX_CHECKER,
            status: 'repairable',
            candidateHash: finalHash,
            checkedFiles,
            diagnostics: [
                ...syntaxDiagnostics,
                ...incompleteDiagnostics.map(({ diagnostic }) => diagnostic),
            ],
        };
    }
    if (incompleteDiagnostics.length > 0) {
        return {
            checker: DELIVERABLE_SYNTAX_CHECKER,
            status: 'incomplete',
            reason: incompleteDiagnostics[0].reason,
            candidateHash: finalHash,
            checkedFiles,
            diagnostics: incompleteDiagnostics.map(({ diagnostic }) => diagnostic),
        };
    }
    return {
        checker: DELIVERABLE_SYNTAX_CHECKER,
        status: 'pass',
        candidateHash: finalHash,
        checkedFiles,
        diagnostics: [],
    };
}
//# sourceMappingURL=deliverable-syntax.js.map