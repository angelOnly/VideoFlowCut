export declare const DELIVERABLE_SKILL_CATALOG_VERSION = "2.2.9";
/** Main deliverable catalog. Describes outputs; never a machine-plan admission gate. */
export declare const DELIVERABLE_SKILL_IDS: readonly ['prototype', 'ppt', 'document', 'image', 'web-clone', 'motion-design', 'hyperframes', 'webgl', 'live-artifact', 'video', 'audio'];
export type DeliverableSkillId = typeof DELIVERABLE_SKILL_IDS[number];
export declare const DELIVERABLE_PRODUCTION_ROUTES: readonly ['prototype-html', 'ppt-html', 'document-html', 'media-image', 'image-html', 'web-clone-html', 'hyperframes-html', 'webgl-html', 'live-artifact', 'media-video', 'media-audio'];
export type DeliverableProductionRoute = typeof DELIVERABLE_PRODUCTION_ROUTES[number];
export interface DeliverableSkillDefinition {
    id: DeliverableSkillId;
    title: string;
    description: string;
    version: string;
    routes: readonly {
        id: DeliverableProductionRoute;
        kind: string;
        extensions: readonly string[];
    }[];
}
export declare const DELIVERABLE_SKILLS: readonly DeliverableSkillDefinition[];
export declare function renderDeliverableSkillCatalog(skillRoot: string): string;
//# sourceMappingURL=deliverable-skills.d.ts.map