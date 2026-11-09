import type { Express } from 'express';
export interface RouteRegistration {
    method: string;
    path: string;
}
export declare function guardedRouteKey(method: string, path: unknown): string | null;
export declare function installRouteRegistrationGuard(app: Express): void;
export declare function getRouteRegistrationInventory(app: Express): RouteRegistration[];
