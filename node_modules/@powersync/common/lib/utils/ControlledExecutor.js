export class ControlledExecutor {
    task;
    /**
     * Represents the currently running task, which could be a Promise or undefined if no task is running.
     */
    runningTask;
    pendingTaskParam;
    /**
     * Flag to determine if throttling is enabled, which controls whether tasks are queued or run immediately.
     */
    isThrottling;
    closed;
    constructor(task, options) {
        this.task = task;
        const { throttleEnabled = true } = options ?? {};
        this.isThrottling = throttleEnabled;
        this.closed = false;
    }
    schedule(param) {
        if (this.closed) {
            return;
        }
        if (!this.isThrottling) {
            this.task(param);
            return;
        }
        if (this.runningTask) {
            // set or replace the pending task param with latest one
            this.pendingTaskParam = param;
            return;
        }
        this.execute(param);
    }
    dispose() {
        this.closed = true;
        if (this.runningTask) {
            this.runningTask = undefined;
        }
    }
    async execute(param) {
        this.runningTask = this.task(param);
        await this.runningTask;
        this.runningTask = undefined;
        if (this.pendingTaskParam) {
            const pendingParam = this.pendingTaskParam;
            this.pendingTaskParam = undefined;
            this.execute(pendingParam);
        }
    }
}
//# sourceMappingURL=ControlledExecutor.js.map