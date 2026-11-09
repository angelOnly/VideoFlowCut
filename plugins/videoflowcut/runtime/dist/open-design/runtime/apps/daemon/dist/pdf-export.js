import path from 'node:path';
import { readProjectFile } from './projects.js';
export async function buildDesktopPdfExportInput(options) {
    const html = options.sourceHtml ?? (await readProjectFile(options.projectsRoot, options.projectId, options.fileName, options.metadata ?? undefined)).buffer.toString('utf8');
    const title = displayTitle(options.title, options.fileName);
    return {
        baseHref: rawBaseHref(options.daemonUrl, options.projectId, options.fileName),
        deck: options.deck === true,
        defaultFilename: `${safeFilename(title, 'artifact')}.pdf`,
        html,
        title,
    };
}
export async function buildDesktopArtifactExportInput(options) {
    const html = options.sourceHtml ?? (await readProjectFile(options.projectsRoot, options.projectId, options.fileName, options.metadata ?? undefined)).buffer.toString('utf8');
    const title = displayTitle(options.title, options.fileName);
    return {
        baseHref: options.baseHref ?? rawBaseHref(options.daemonUrl, options.projectId, options.fileName),
        deck: options.deck === true,
        format: options.format,
        html,
        title,
        ...(options.imageFormat ? { imageFormat: options.imageFormat } : {}),
        ...(options.width ? { width: options.width } : {}),
        ...(options.height ? { height: options.height } : {}),
    };
}
function displayTitle(title, fileName) {
    if (typeof title === 'string' && title.trim().length > 0)
        return title.trim();
    const base = path.posix.basename(fileName);
    const dot = base.lastIndexOf('.');
    return dot > 0 ? base.slice(0, dot) : base || 'artifact';
}
function rawBaseHref(daemonUrl, projectId, fileName) {
    const dir = path.posix.dirname(fileName.replace(/^\/+/, ''));
    const safeProjectId = encodeURIComponent(projectId);
    const rawBase = `${daemonUrl.replace(/\/+$/, '')}/api/projects/${safeProjectId}/raw/`;
    if (!dir || dir === '.')
        return rawBase;
    return `${rawBase}${encodePathSegments(dir)}/`;
}
function encodePathSegments(value) {
    return value
        .split('/')
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join('/');
}
function safeFilename(name, fallback) {
    const slug = (name || fallback)
        .replace(/[^\w.\-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
    return slug || fallback;
}
//# sourceMappingURL=pdf-export.js.map