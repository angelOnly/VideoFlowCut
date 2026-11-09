import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
export interface RegisterActiveContextRoutesDeps extends RouteDeps<'db' | 'http' | 'projectStore'> {
}
interface ActiveContext {
    projectId: string;
    fileName: string | null;
    ts: number;
}
interface ActiveContextStore {
    current: ActiveContext | null;
}
type PostActiveInput = {
    kind: 'clear';
} | {
    kind: 'set';
    projectId: string;
    fileName: string | null;
};
type PostActiveOutput = {
    active: false;
} | {
    active: true;
    projectId: string;
    fileName: string | null;
    ts: number;
};
type GetActiveOutput = {
    active: false;
} | {
    active: true;
    projectId: string;
    projectName: string | null;
    fileName: string | null;
    ts: number;
    ageMs: number;
};
interface ActiveContextDomainDeps {
    store: ActiveContextStore;
    db: unknown;
    getProject: (db: unknown, projectId: string) => {
        name?: string | null;
    } | null | undefined;
    now: () => number;
}
export declare const postActiveRoute: import("../http/types.js").JsonRouteSpec<PostActiveInput, PostActiveOutput, ActiveContextDomainDeps>;
export declare const getActiveRoute: import("../http/types.js").JsonRouteSpec<void, GetActiveOutput, ActiveContextDomainDeps>;
export declare function registerActiveContextRoutes(app: Express, ctx: RegisterActiveContextRoutesDeps): void;
export {};
