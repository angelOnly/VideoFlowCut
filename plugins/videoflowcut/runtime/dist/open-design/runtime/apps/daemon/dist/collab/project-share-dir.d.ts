export declare function resolveProjectShareDir(projectsRoot: string, projectId: string, project: {
    id: string;
    metadata?: unknown;
} | null | undefined, resolveProjectDir: (projectsRoot: string, projectId: string, metadata?: unknown) => string): string;
