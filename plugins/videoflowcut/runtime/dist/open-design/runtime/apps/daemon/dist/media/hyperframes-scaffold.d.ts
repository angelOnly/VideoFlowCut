import type { HyperFramesScaffoldResponse } from '@open-design/contracts';
export type HyperFramesScaffoldResult = HyperFramesScaffoldResponse;
export declare function scaffoldHyperFramesComposition(input: {
    projectDir: string;
    compositionDir: string;
    now?: Date;
}): Promise<HyperFramesScaffoldResult>;
