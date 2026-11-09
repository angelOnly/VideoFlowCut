export interface SigV4Credentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
}
export interface SignSigV4Input {
    method: string;
    path: string;
    query: string;
    headers: Record<string, string>;
    body: Buffer;
    region: string;
    service: string;
    credentials: SigV4Credentials;
    now?: Date;
}
export interface SignSigV4Result {
    authorization: string;
    amzDate: string;
    contentSha256: string;
}
export declare function signSigV4(input: SignSigV4Input): SignSigV4Result;
export declare function encodeS3PathSegment(seg: string): string;
