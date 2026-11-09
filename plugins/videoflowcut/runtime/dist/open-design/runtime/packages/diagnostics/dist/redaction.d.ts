export interface RedactionOptions {
    username?: string | undefined;
}
export declare function redactJsonValue(value: unknown, opts?: RedactionOptions): unknown;
export declare function redactText(text: string, opts?: RedactionOptions): string;
export declare function redactJsonText(text: string, opts?: RedactionOptions): string;
