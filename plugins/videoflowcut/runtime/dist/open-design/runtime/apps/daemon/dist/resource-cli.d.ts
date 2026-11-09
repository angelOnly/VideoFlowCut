/**
 * `od resource` is a compatibility entry point for the login-backed Vela
 * resource drive. OpenDesign intentionally owns no Resource Hub credentials
 * or content-addressed transfer implementation.
 */
export declare function runResource(args: string[]): Promise<void>;
