/**
 * Calls to Abortcontroller.abort(reason: any) will result in the
 * `reason` being thrown. This is not necessarily an error,
 *  but extends error for better logging purposes.
 */
export class AbortOperation extends Error {
    reason;
    constructor(reason) {
        super(reason);
        this.reason = reason;
        // Set the prototype explicitly
        Object.setPrototypeOf(this, AbortOperation.prototype);
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AbortOperation);
        }
    }
}
//# sourceMappingURL=AbortOperation.js.map