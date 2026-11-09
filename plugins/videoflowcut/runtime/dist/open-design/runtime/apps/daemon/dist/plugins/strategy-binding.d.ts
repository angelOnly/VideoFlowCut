import type { ProjectMetadata, ProjectScenarioTaskProfile, ProjectStrategyBinding } from '@open-design/contracts';
export declare function createAutomaticProjectStrategyBinding(input: {
    metadata: ProjectMetadata | null | undefined;
    taskProfile: ProjectScenarioTaskProfile;
    boundAt?: number;
}): ProjectStrategyBinding | null;
export declare function readVerifiedProjectStrategyBinding(metadata: ProjectMetadata | null | undefined): ProjectStrategyBinding | null;
