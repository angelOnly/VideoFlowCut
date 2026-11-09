export interface BrowserSessionView {
    id: string;
    websocketUrl: string;
}
export declare function findBrowserExecutable(): string | null;
export declare function createBrowserSessionService(): {
    create: () => Promise<BrowserSessionView>;
    close: (id: string) => Promise<boolean>;
    shutdownActive: () => Promise<void>;
};
export type BrowserSessionService = ReturnType<typeof createBrowserSessionService>;
