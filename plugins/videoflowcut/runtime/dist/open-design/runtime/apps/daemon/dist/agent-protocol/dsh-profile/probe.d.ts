import type { DshProfileModelCatalogEntry, DshProfileProbeFrame } from './types.js';
export declare function parseDshProfileProbeOutput(stdout: string): DshProfileProbeFrame;
export declare function parseDshProfileModelsOutput(stdout: string): DshProfileModelCatalogEntry[] | null;
