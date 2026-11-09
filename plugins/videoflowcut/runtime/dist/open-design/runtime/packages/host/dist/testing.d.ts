import { type OpenDesignHostBridge, type OpenDesignHostGlobalScope } from "./index.js";
export type MockOpenDesignHost = Partial<Omit<OpenDesignHostBridge, "capture" | "client" | "pdf" | "pet" | "preview" | "project" | "shell" | "updater">> & {
    browser?: Partial<OpenDesignHostBridge["browser"]>;
    capture?: Partial<OpenDesignHostBridge["capture"]>;
    client?: Partial<OpenDesignHostBridge["client"]>;
    pdf?: Partial<OpenDesignHostBridge["pdf"]>;
    pet?: Partial<OpenDesignHostBridge["pet"]>;
    preview?: Partial<NonNullable<OpenDesignHostBridge["preview"]>>;
    project?: Partial<OpenDesignHostBridge["project"]>;
    shell?: Partial<OpenDesignHostBridge["shell"]>;
    updater?: Partial<OpenDesignHostBridge["updater"]>;
};
export type MockOpenDesignHostOptions = {
    host?: MockOpenDesignHost;
    scope?: OpenDesignHostGlobalScope;
};
export declare function createMockOpenDesignHost(overrides?: MockOpenDesignHost): OpenDesignHostBridge;
export declare function installMockOpenDesignHost(options?: MockOpenDesignHostOptions): () => void;
//# sourceMappingURL=testing.d.ts.map