import type Database from 'better-sqlite3';
type JsonObject = Record<string, unknown>;
export interface DeploymentLike {
    providerId?: string | null;
    url?: string | null;
    providerMetadata?: JsonObject | null;
    cloudflarePages?: JsonObject | null;
    [key: string]: unknown;
}
export declare function cloudflarePagesDeploymentMetadata(projectName: string | null | undefined): JsonObject | undefined;
export declare function cloudflarePagesProjectNameFromDeployment(deployment: DeploymentLike | null | undefined): string;
export declare function cloudflarePagesProjectNameForDeploy(db: Database.Database, projectId: string, projectName: string, prior: DeploymentLike | null | undefined): string;
export declare function publicDeployment<T extends DeploymentLike>(deployment: T): Omit<T, 'providerMetadata'>;
export declare function publicDeployment<T>(deployment: T): T;
export declare function publicDeployments<T extends DeploymentLike>(deployments: readonly T[] | null | undefined): Array<Omit<T, 'providerMetadata'>>;
export declare function checkCloudflarePagesDeploymentLinks(existing: DeploymentLike): Promise<DeploymentLike>;
export {};
