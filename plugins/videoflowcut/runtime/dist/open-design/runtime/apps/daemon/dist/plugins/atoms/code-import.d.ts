export interface CodeImportFileEntry {
    path: string;
    size: number;
    language: 'ts' | 'tsx' | 'js' | 'jsx' | 'css' | 'scss' | 'json' | 'html' | 'md' | 'other';
    imports?: string[];
}
export interface CodeImportSkipped {
    path: string;
    reason: 'directory-skiplist' | 'unsupported-extension' | 'budget-exceeded' | 'symlink' | 'large-file';
}
export interface CodeImportIndex {
    files: CodeImportFileEntry[];
    skipped: CodeImportSkipped[];
    framework: 'next' | 'vite' | 'remix' | 'astro' | 'sveltekit' | 'cra' | 'custom' | 'unknown';
    packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown';
    packageJson?: {
        name?: string;
        version?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };
    styleSystem: 'tailwind' | 'css' | 'styled-components' | 'emotion' | 'unknown';
    routes?: {
        kind: 'next-app' | 'next-pages' | 'react-router' | 'vite-router' | 'sveltekit' | 'unknown';
    };
    walkedAt: string;
    walkBudgetMs: number;
}
export interface CodeImportRunOptions {
    repoPath: string;
    cwd: string;
    budgetMs?: number;
    largeFileBytes?: number;
}
export declare function runCodeImport(opts: CodeImportRunOptions): Promise<CodeImportIndex>;
