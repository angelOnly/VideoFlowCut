export type AmrProfile = 'prod' | 'test' | 'feature-test' | 'local';
type EnvMap = NodeJS.ProcessEnv | Record<string, string | undefined>;
export declare function resolveAmrProfile(env?: EnvMap): AmrProfile;
export declare function amrVelaProfileEnv(env?: EnvMap): {
    VELA_PROFILE: AmrProfile;
};
export {};
