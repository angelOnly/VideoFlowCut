export interface OAuthResultPageOptions {
    ok: boolean;
    serverId?: string | null;
    message?: string | null;
}
export declare function renderOAuthResultPage(opts: OAuthResultPageOptions): string;
