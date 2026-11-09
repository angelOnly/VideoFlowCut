// Phase 5 / spec §15.6 — `ProjectStorage` adapter interface.
//
// The daemon's project filesystem usage today is concentrated in
// `apps/daemon/src/projects.ts` (read/write/list/delete). Spec §15.6
// folds those calls behind a narrow interface so a future Phase 5
// patch can swap the implementation between local-disk (v1 default)
// and S3-compatible blob stores (AWS S3, GCS S3-compat, Azure Blob
// shim, Aliyun OSS, Tencent COS, Huawei OBS) without rewriting
// callers.
//
// This module is the substrate slice. It ships:
//
//   - `ProjectStorage` interface — the narrow contract every backend
//     implements (read / write / list / delete / stat).
//   - `LocalProjectStorage` — a thin wrapper over the existing
//     `apps/daemon/src/projects.ts` helpers; this is the v1 default.
//   - `S3ProjectStorage` — a stub that mirrors the interface and
//     records the operations it would perform. The real AWS SDK
//     wiring is the next Phase 5 PR; the stub exists so unit tests
//     can lock the interface contract.
//
// The daemon's existing project routes don't yet route through this
// adapter — that's an opt-in flag away (`OD_PROJECT_STORAGE=s3`).
// The substrate slice keeps the call sites unchanged so a wrong
// adapter never silently corrupts user data on roll-out.
import path from 'node:path';
import { promises as fsp } from 'node:fs';
import { encodeS3PathSegment, signSigV4 } from './aws-sigv4.js';
export class StorageError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'StorageError';
    }
}
/**
 * v1 default — backed by the daemon's existing `<dataDir>/.od/projects/`
 * filesystem layout. Pure pass-through to fs/promises with the
 * traversal guard the legacy `projects.ts` helpers already enforce.
 */
export class LocalProjectStorage {
    projectsRoot;
    constructor(projectsRoot) {
        this.projectsRoot = projectsRoot;
    }
    async readFile(projectId, relpath) {
        const abs = this.resolvePath(projectId, relpath);
        try {
            return await fsp.readFile(abs);
        }
        catch (err) {
            const e = err;
            if (e.code === 'ENOENT')
                throw new StorageError('NOT_FOUND', `${projectId}/${relpath} not found`);
            throw new StorageError('IO', `read failed: ${e.message ?? String(e)}`);
        }
    }
    async writeFile(projectId, relpath, body) {
        const abs = this.resolvePath(projectId, relpath);
        await fsp.mkdir(path.dirname(abs), { recursive: true });
        await fsp.writeFile(abs, body);
        const stat = await fsp.stat(abs);
        return {
            path: normalizeRel(relpath),
            size: stat.size,
            mtimeMs: stat.mtimeMs,
        };
    }
    async listFiles(projectId) {
        const root = path.join(this.projectsRoot, projectId);
        const out = [];
        const queue = [root];
        while (queue.length > 0) {
            const dir = queue.pop();
            let entries;
            try {
                entries = await fsp.readdir(dir, { withFileTypes: true });
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    return [];
                throw new StorageError('IO', `list failed: ${err.message}`);
            }
            for (const entry of entries) {
                const abs = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    queue.push(abs);
                    continue;
                }
                if (!entry.isFile())
                    continue;
                const stat = await fsp.stat(abs);
                const rel = path.relative(root, abs).split(path.sep).join('/');
                out.push({ path: rel, size: stat.size, mtimeMs: stat.mtimeMs });
            }
        }
        return out;
    }
    async deleteFile(projectId, relpath) {
        const abs = this.resolvePath(projectId, relpath);
        try {
            await fsp.rm(abs, { force: true });
        }
        catch (err) {
            throw new StorageError('IO', `delete failed: ${err.message}`);
        }
    }
    async statFile(projectId, relpath) {
        const abs = this.resolvePath(projectId, relpath);
        try {
            const stat = await fsp.stat(abs);
            if (!stat.isFile())
                return null;
            return {
                path: normalizeRel(relpath),
                size: stat.size,
                mtimeMs: stat.mtimeMs,
            };
        }
        catch {
            return null;
        }
    }
    resolvePath(projectId, relpath) {
        if (!projectId || projectId.includes('/') || projectId.includes('\\') || projectId.includes('\0') || projectId.includes('..')) {
            throw new StorageError('TRAVERSAL', `invalid projectId ${projectId}`);
        }
        const normalized = normalizeRel(relpath);
        if (!normalized)
            throw new StorageError('TRAVERSAL', 'empty relpath');
        if (normalized.split('/').some((seg) => seg === '..' || seg === '.')) {
            throw new StorageError('TRAVERSAL', `unsafe relpath ${relpath}`);
        }
        return path.join(this.projectsRoot, projectId, ...normalized.split('/'));
    }
}
export class S3ProjectStorage {
    options;
    fetchFn;
    constructor(options) {
        this.options = options;
        if (!options.bucket)
            throw new StorageError('IO', 'S3ProjectStorage requires a bucket');
        if (!options.region)
            throw new StorageError('IO', 'S3ProjectStorage requires a region');
        if (!options.credentials?.accessKeyId)
            throw new StorageError('IO', 'S3ProjectStorage requires credentials.accessKeyId');
        if (!options.credentials?.secretAccessKey)
            throw new StorageError('IO', 'S3ProjectStorage requires credentials.secretAccessKey');
        const fn = options.fetchFn ?? globalThis.fetch;
        if (!fn)
            throw new StorageError('IO', 'S3ProjectStorage requires a fetch implementation');
        this.fetchFn = fn;
    }
    async readFile(projectId, relpath) {
        const key = this.keyFor(projectId, relpath);
        const res = await this.signedRequest({ method: 'GET', key });
        if (res.status === 404)
            throw new StorageError('NOT_FOUND', `${projectId}/${relpath} not found`);
        if (!res.ok)
            throw new StorageError('IO', `S3 GET ${key} \u2192 ${res.status} ${res.statusText}: ${await safeText(res)}`);
        return Buffer.from(await res.arrayBuffer());
    }
    async writeFile(projectId, relpath, body) {
        const key = this.keyFor(projectId, relpath);
        const res = await this.signedRequest({ method: 'PUT', key, body });
        if (!res.ok)
            throw new StorageError('IO', `S3 PUT ${key} \u2192 ${res.status} ${res.statusText}: ${await safeText(res)}`);
        return {
            path: normalizeRel(relpath),
            size: body.byteLength,
            mtimeMs: Date.now(),
        };
    }
    async deleteFile(projectId, relpath) {
        const key = this.keyFor(projectId, relpath);
        const res = await this.signedRequest({ method: 'DELETE', key });
        // S3 returns 204 on successful delete; idempotent if missing.
        if (!res.ok && res.status !== 404) {
            throw new StorageError('IO', `S3 DELETE ${key} \u2192 ${res.status} ${res.statusText}: ${await safeText(res)}`);
        }
    }
    async statFile(projectId, relpath) {
        const key = this.keyFor(projectId, relpath);
        const res = await this.signedRequest({ method: 'HEAD', key });
        if (res.status === 404)
            return null;
        if (!res.ok)
            throw new StorageError('IO', `S3 HEAD ${key} \u2192 ${res.status} ${res.statusText}`);
        const contentLength = Number(res.headers.get('content-length') ?? '0');
        const lastModified = res.headers.get('last-modified');
        return {
            path: normalizeRel(relpath),
            size: Number.isFinite(contentLength) ? contentLength : 0,
            mtimeMs: lastModified ? Date.parse(lastModified) : Date.now(),
        };
    }
    async listFiles(projectId) {
        const projectPrefix = this.keyFor(projectId, '');
        const out = [];
        let continuationToken;
        // Cap iterations so a hostile bucket can't loop forever.
        for (let pages = 0; pages < 1000; pages++) {
            const params = [
                ['list-type', '2'],
                ['prefix', projectPrefix],
            ];
            if (continuationToken)
                params.push(['continuation-token', continuationToken]);
            params.sort((a, b) => a[0].localeCompare(b[0]));
            const query = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
            const res = await this.signedRequest({ method: 'GET', key: '', extraQuery: query });
            if (!res.ok) {
                throw new StorageError('IO', `S3 LIST ${projectPrefix} \u2192 ${res.status} ${res.statusText}: ${await safeText(res)}`);
            }
            const xml = await res.text();
            const { entries, isTruncated, nextToken } = parseListBucketV2Xml(xml);
            for (const e of entries) {
                // Strip the per-bucket projectPrefix to surface project-relative paths.
                const relStart = projectPrefix ? projectPrefix.length + (projectPrefix.endsWith('/') ? 0 : 1) : 0;
                const rel = e.key.slice(relStart).replace(/^\/+/, '');
                if (!rel)
                    continue; // skip the prefix marker itself
                out.push({ path: rel, size: e.size, mtimeMs: e.lastModifiedMs });
            }
            if (!isTruncated || !nextToken)
                break;
            continuationToken = nextToken;
        }
        return out;
    }
    // Build the canonical S3 key the impl uses. Exposed for tests so
    // the prefix / projectId / relpath join is stable.
    keyFor(projectId, relpath) {
        if (!projectId || projectId.includes('/') || projectId.includes('\\') || projectId.includes('..')) {
            throw new StorageError('TRAVERSAL', `invalid projectId ${projectId}`);
        }
        const normalized = relpath ? normalizeRel(relpath) : '';
        if (normalized.split('/').some((seg) => seg === '..' || seg === '.')) {
            throw new StorageError('TRAVERSAL', `unsafe relpath ${relpath}`);
        }
        const segments = [this.options.prefix?.replace(/^\/+|\/+$/g, ''), projectId, normalized]
            .filter((s) => typeof s === 'string' && s.length > 0);
        return segments.join('/');
    }
    endpointBase() {
        if (this.options.endpoint)
            return this.options.endpoint.replace(/\/+$/, '');
        return `https://${this.options.bucket}.s3.${this.options.region}.amazonaws.com`;
    }
    async signedRequest(args) {
        const base = this.endpointBase();
        const baseHost = new URL(base).host;
        // Path-style for endpoint overrides (typical for S3-compat
        // services + MinIO test setups); virtual-host-style when
        // endpoint is omitted (default AWS S3).
        let pathSegment;
        let host;
        if (this.options.endpoint) {
            const segments = [this.options.bucket, ...args.key.split('/').filter(Boolean).map(encodeS3PathSegment)];
            pathSegment = '/' + segments.join('/');
            host = baseHost;
        }
        else {
            const segments = args.key.split('/').filter(Boolean).map(encodeS3PathSegment);
            pathSegment = segments.length === 0 ? '/' : '/' + segments.join('/');
            host = baseHost;
        }
        const headers = {
            'host': host,
        };
        const body = args.body ?? Buffer.alloc(0);
        const now = this.options.now ? this.options.now() : new Date();
        signSigV4({
            method: args.method,
            path: pathSegment,
            query: args.extraQuery ?? '',
            headers,
            body,
            region: this.options.region,
            service: 's3',
            credentials: this.options.credentials,
            now,
        });
        const url = `${base.replace(/\/+$/, '')}${pathSegment}${args.extraQuery ? `?${args.extraQuery}` : ''}`;
        const init = {
            method: args.method,
            headers,
            ...(args.body ? { body: args.body } : {}),
        };
        return this.fetchFn(url, init);
    }
}
function parseListBucketV2Xml(xml) {
    const entries = [];
    // Lightweight XML scrape — we accept S3 / S3-compat shapes:
    //   <Contents>
    //     <Key>...</Key>
    //     <LastModified>2026-...</LastModified>
    //     <Size>1234</Size>
    //   </Contents>
    // and a single <NextContinuationToken>...</NextContinuationToken>
    // and <IsTruncated>true|false</IsTruncated>.
    const contentsRe = /<Contents\b[^>]*>([\s\S]*?)<\/Contents>/g;
    let m;
    while ((m = contentsRe.exec(xml)) !== null) {
        const block = m[1] ?? '';
        const key = pluckTag(block, 'Key');
        const size = Number(pluckTag(block, 'Size') ?? '0');
        const lastModifiedRaw = pluckTag(block, 'LastModified');
        if (!key)
            continue;
        entries.push({
            key,
            size: Number.isFinite(size) ? size : 0,
            lastModifiedMs: lastModifiedRaw ? Date.parse(lastModifiedRaw) : Date.now(),
        });
    }
    const isTruncated = (pluckTag(xml, 'IsTruncated') ?? 'false').toLowerCase() === 'true';
    const nextToken = pluckTag(xml, 'NextContinuationToken') ?? undefined;
    return nextToken ? { entries, isTruncated, nextToken } : { entries, isTruncated };
}
function pluckTag(text, tag) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const m = re.exec(text);
    return m ? m[1] : undefined;
}
async function safeText(res) {
    try {
        return (await res.text()).slice(0, 256);
    }
    catch {
        return '';
    }
}
/**
 * Resolve the daemon-wide project storage adapter from environment.
 * Default is local-disk; setting OD_PROJECT_STORAGE=s3 pulls the
 * stub above (and will pull the real impl once it lands).
 */
export function resolveProjectStorage(opts) {
    const env = opts.env ?? process.env;
    const kind = (env.OD_PROJECT_STORAGE ?? 'local').trim().toLowerCase();
    if (kind === 's3') {
        // Read AWS creds from the OD-specific knobs first, then fall
        // back to the standard AWS_* env vars so existing AWS toolchain
        // setups (`aws configure` exporters, IAM-role pods) drop in
        // without renaming.
        const accessKeyId = env.OD_S3_ACCESS_KEY_ID ?? env.AWS_ACCESS_KEY_ID ?? '';
        const secretAccessKey = env.OD_S3_SECRET_ACCESS_KEY ?? env.AWS_SECRET_ACCESS_KEY ?? '';
        const sessionToken = env.OD_S3_SESSION_TOKEN ?? env.AWS_SESSION_TOKEN;
        const credentials = { accessKeyId, secretAccessKey };
        if (sessionToken)
            credentials.sessionToken = sessionToken;
        return new S3ProjectStorage({
            bucket: env.OD_S3_BUCKET ?? '',
            region: env.OD_S3_REGION ?? env.AWS_REGION ?? '',
            ...(env.OD_S3_PREFIX ? { prefix: env.OD_S3_PREFIX } : {}),
            ...(env.OD_S3_ENDPOINT ? { endpoint: env.OD_S3_ENDPOINT } : {}),
            credentials,
        });
    }
    return new LocalProjectStorage(opts.projectsRoot);
}
function normalizeRel(relpath) {
    return String(relpath || '')
        .replace(/^[\\/]+/, '')
        .replace(/[\\]+/g, '/')
        .replace(/\/+/g, '/');
}
//# sourceMappingURL=project-storage.js.map