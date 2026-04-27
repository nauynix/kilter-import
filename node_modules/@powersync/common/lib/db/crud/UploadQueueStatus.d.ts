export declare class UploadQueueStats {
    /**
     * Number of records in the upload queue.
     */
    count: number;
    /**
     * Size of the upload queue in bytes.
     */
    size: number | null;
    constructor(
    /**
     * Number of records in the upload queue.
     */
    count: number, 
    /**
     * Size of the upload queue in bytes.
     */
    size?: number | null);
    toString(): string;
}
