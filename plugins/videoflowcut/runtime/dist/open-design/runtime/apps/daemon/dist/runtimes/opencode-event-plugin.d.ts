export declare const OPEN_CODE_EVENT_PLUGIN_SOURCE: string;
export declare function supportsOpenCodeEventPlugin(version: string | undefined): boolean;
/** Mutates only this child's config overlay; dataDir is the daemon's resolved root. */
export declare function applyOpenCodeEventPlugin(env: NodeJS.ProcessEnv, dataDir: string, version: string | undefined, inheritedConfigContent?: string): Promise<boolean>;
