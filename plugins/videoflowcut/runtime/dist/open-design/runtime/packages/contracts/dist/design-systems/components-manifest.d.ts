export declare const COMPONENTS_MANIFEST_SCHEMA_VERSION: 1;
export type ComponentsManifestSchemaVersion = typeof COMPONENTS_MANIFEST_SCHEMA_VERSION;
export type ComponentManifestGroupId = 'buttons' | 'inputs' | 'cards' | 'badges' | 'links' | 'keyboard' | 'icons' | 'typography' | 'layout';
export type ComponentManifestGroup = {
    id: ComponentManifestGroupId;
    label: string;
    present: boolean;
    selectors: string[];
    classes: string[];
    elements: string[];
    tokenReferences: string[];
};
export type ComponentManifestLiteralInventory = {
    colorExpressions: number;
    pixelValues: number;
    hardcodedFontFamilies: number;
};
export type ComponentsManifest = {
    schemaVersion: ComponentsManifestSchemaVersion;
    brandId: string;
    source: {
        componentsHtml: 'components.html';
        tokensCss?: 'tokens.css';
    };
    fixture: {
        title?: string;
        description?: string;
        styleBlockCount: number;
        selectorCount: number;
        classCount: number;
        elementCount: number;
    };
    tokens: {
        declared: string[];
        referenced: string[];
        unusedDeclared: string[];
        undeclaredReferenced: string[];
    };
    selectors: string[];
    classes: string[];
    elements: string[];
    groups: ComponentManifestGroup[];
    literals: ComponentManifestLiteralInventory;
};
export type ExtractComponentsManifestInput = {
    brandId: string;
    fixtureHtml: string;
    tokensCss?: string;
};
export declare function extractComponentsManifest({ brandId, fixtureHtml, tokensCss, }: ExtractComponentsManifestInput): ComponentsManifest;
export declare function summarizeComponentsManifestForPrompt(manifest: ComponentsManifest): string;
//# sourceMappingURL=components-manifest.d.ts.map