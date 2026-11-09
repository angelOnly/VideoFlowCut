export declare class MalformedBlockError extends Error {
    readonly position: number;
    constructor(message: string, position: number);
}
export declare class OversizeBlockError extends Error {
    readonly position: number;
    constructor(message: string, position: number);
}
export declare class MissingArtifactError extends Error {
    constructor(message: string);
}
