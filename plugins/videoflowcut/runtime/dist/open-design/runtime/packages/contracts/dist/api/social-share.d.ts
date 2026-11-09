export declare const OPEN_DESIGN_GITHUB_REPO_URL = "https://github.com/nexu-io/open-design";
export type SocialShareTargetKind = 'open-design-repo' | 'project-html';
export type SocialSharePlatform = 'x' | 'linkedin' | 'facebook' | 'reddit' | 'telegram' | 'whatsapp' | 'weibo' | 'line' | 'instagram' | 'xiaohongshu';
export type SocialShareMode = 'intent' | 'copy-open';
export interface SocialShareRequest {
    kind: SocialShareTargetKind;
    url?: string;
    title?: string;
    text?: string;
    copyText?: string;
    locale?: string;
}
export interface SocialSharePlatformTarget {
    platform: SocialSharePlatform;
    mode: SocialShareMode;
    shareUrl?: string;
    entryUrl?: string;
}
export interface SocialShareResponse {
    kind: SocialShareTargetKind;
    locale: string;
    url: string;
    title: string;
    text: string;
    copyText: string;
    githubRepoUrl: string;
    platforms: SocialSharePlatformTarget[];
}
export declare const SOCIAL_SHARE_PLATFORM_ORDER: SocialSharePlatform[];
export declare function normalizeSocialShareUrl(value: unknown): string | null;
export declare function buildSocialSharePayload(input: SocialShareRequest): SocialShareResponse;
//# sourceMappingURL=social-share.d.ts.map