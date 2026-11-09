export declare const API_TOKEN_BASIC_USERNAME = "open-design";
export declare const API_TOKEN_BASIC_CHALLENGE = "Basic realm=\"OpenDesign\", charset=\"UTF-8\"";
export declare function isTruthyEnvFlag(value: unknown): boolean;
export declare function isApiAuthDisabled(env?: NodeJS.ProcessEnv): boolean;
export declare function apiTokenFromEnv(env?: NodeJS.ProcessEnv): string;
export declare function isApiTokenMiddlewareEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function apiTokenAuthorizationMatches(value: unknown, apiToken: string): boolean;
