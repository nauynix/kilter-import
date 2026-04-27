export interface ControlledExecutorOptions {
    /**
     * If throttling is enabled, it ensures only one task runs at a time,
     * and only one additional task can be scheduled to run after the current task completes. The pending task will be overwritten by the latest task.
     * Enabled by default.
     */
    throttleEnabled?: boolean;
}
export declare class ControlledExecutor<T> {
    private task;
    /**
     * Represents the currently running task, which could be a Promise or undefined if no task is running.
     */
    private runningTask;
    private pendingTaskParam;
    /**
     * Flag to determine if throttling is enabled, which controls whether tasks are queued or run immediately.
     */
    private isThrottling;
    private closed;
    constructor(task: (param: T) => Promise<void> | void, options?: ControlledExecutorOptions);
    schedule(param: T): void;
    dispose(): void;
    private execute;
}
