export function resolveProjectShareDir(projectsRoot, projectId, project, resolveProjectDir) {
    if (!project)
        throw new Error(`Project ${projectId} not found`);
    return resolveProjectDir(projectsRoot, projectId, project.metadata);
}
//# sourceMappingURL=project-share-dir.js.map