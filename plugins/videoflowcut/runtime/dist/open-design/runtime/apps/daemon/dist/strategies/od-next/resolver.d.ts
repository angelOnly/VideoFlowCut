type Availability = {
    id: string;
    available: boolean;
};
export interface OdNextIntakePreflightInput {
    inputRefs: ReadonlyArray<{
        id: string;
        accessible: boolean;
    }>;
    selectedAgentAvailable: boolean;
    taskProfileAvailable: boolean;
    dependencies: ReadonlyArray<Availability>;
}
export interface OdNextPreflightResult {
    status: 'passed' | 'blocked';
    reasonCodes: string[];
}
export declare function runIntakePreflight(input: OdNextIntakePreflightInput): OdNextPreflightResult;
export {};
