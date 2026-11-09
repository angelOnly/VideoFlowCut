export type SignalKind = 'number' | 'boolean';
export interface UntilSignals {
    'critique.score'?: number | undefined;
    'iterations'?: number | undefined;
    'user.confirmed'?: boolean | undefined;
    'preview.ok'?: boolean | undefined;
    'build.passing'?: boolean | undefined;
    'tests.passing'?: boolean | undefined;
}
export type UntilOp = '==' | '!=' | '>=' | '<=' | '>' | '<';
export interface UntilComparison {
    signal: keyof UntilSignals;
    op: UntilOp;
    value: number | boolean;
}
export interface UntilExpression {
    any: UntilComparison[][];
}
export declare class UntilSyntaxError extends Error {
    constructor(message: string);
}
export declare function parseUntil(source: string): UntilExpression;
export interface EvaluationResult {
    satisfied: boolean;
    matched: UntilComparison[];
}
export declare function evaluateUntil(expression: UntilExpression, signals: UntilSignals): EvaluationResult;
export declare function isParseableUntil(source: string): boolean;
