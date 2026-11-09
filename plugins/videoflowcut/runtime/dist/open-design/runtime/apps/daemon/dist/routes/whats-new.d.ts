import type { Express } from 'express';
import { type WhatsNewService } from '../services/whats-new.js';
export interface RegisterWhatsNewRoutesDeps {
    whatsNew: WhatsNewService;
}
export declare function registerWhatsNewRoutes(app: Express, ctx: RegisterWhatsNewRoutesDeps): void;
