export declare function stripTerminalControlSequences(value: string): string;
export declare class TerminalControlSequenceStripper {
    #private;
    write(chunk: unknown): string;
    flush(): string;
}
