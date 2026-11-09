import { getStrategyTaskExecution, } from '../task-store.js';
import { runIntakePreflight, } from './resolver.js';
export class OdNextCoordinatorError extends Error {
    reasonCodes;
    constructor(message, reasonCodes) {
        super(message);
        this.reasonCodes = reasonCodes;
        this.name = 'OdNextCoordinatorError';
    }
}
function requireTask(db, taskExecutionId) {
    const task = getStrategyTaskExecution(db, taskExecutionId);
    if (!task) {
        throw new OdNextCoordinatorError(`Unknown OD Next task execution ${taskExecutionId}.`, ['od_next_task_not_found']);
    }
    return task;
}
export function prepareStrategyIntake(db, input) {
    const current = requireTask(db, input.taskExecutionId);
    if (current.route !== null
        || current.inputStage !== 'request'
        || current.runs.length !== 1) {
        throw new OdNextCoordinatorError('OD Next routes each new logical task exactly once.', ['od_next_route_already_locked']);
    }
    if (current.outcome !== 'running') {
        throw new OdNextCoordinatorError('Only a running request can be routed.', ['od_next_task_not_running']);
    }
    const { reasonCodes } = runIntakePreflight(input.intake);
    return { ok: reasonCodes.length === 0, reasonCodes };
}
//# sourceMappingURL=coordinator.js.map