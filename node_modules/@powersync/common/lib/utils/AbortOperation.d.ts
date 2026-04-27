/**
 * Calls to Abortcontroller.abort(reason: any) will result in the
 * `reason` being thrown. This is not necessarily an error,
 *  but extends error for better logging purposes.
 */
export declare class AbortOperation extends Error {
    protected reason: string;
    constructor(reason: string);
}
