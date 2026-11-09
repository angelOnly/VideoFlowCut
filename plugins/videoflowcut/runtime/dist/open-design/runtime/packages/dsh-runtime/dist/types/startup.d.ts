import type { Context } from '@deepseek-ai/cordis';
export declare const name = "open-design-startup";
export declare const inject: string[];
export declare const OPEN_DESIGN_STARTUP_SERVICE = "openDesignStartup";
export interface OpenDesignStartupValues {
    mode: 'models' | 'probe' | 'stdio';
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        openDesignStartup?: OpenDesignStartupValues;
    }
}
export declare function apply(ctx: Context): void;
