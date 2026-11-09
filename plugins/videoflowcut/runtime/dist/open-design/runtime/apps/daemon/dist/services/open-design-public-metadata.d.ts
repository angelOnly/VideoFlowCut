export interface OpenDesignGithubRepoStats {
    stargazersCount: number;
    fetchedAt: number;
    stale: boolean;
}
export interface OpenDesignGithubLatestReleaseInfo {
    tagName: string;
    htmlUrl: string;
    fetchedAt: number;
    stale: boolean;
}
export interface OpenDesignDiscordPresence {
    onlineCount: number;
    memberCount: number;
    fetchedAt: number;
    stale: boolean;
}
export interface OpenDesignPublicMetadataService {
    readGithubRepoStats(): Promise<OpenDesignGithubRepoStats>;
    readLatestReleaseInfo(): Promise<OpenDesignGithubLatestReleaseInfo>;
    readDiscordPresence(): Promise<OpenDesignDiscordPresence>;
}
export interface OpenDesignPublicMetadataServiceOptions {
    fetchImpl?: typeof fetch;
    now?: () => number;
}
export declare const OPEN_DESIGN_DISCORD_INVITE_URL = "https://discord.gg/mHAjSMV6gz";
export declare function createOpenDesignPublicMetadataService({ fetchImpl, now, }?: OpenDesignPublicMetadataServiceOptions): OpenDesignPublicMetadataService;
