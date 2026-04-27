import { CrudEntry } from './CrudEntry.js';
/**
 * A batch of client-side changes.
 */
export declare class CrudBatch {
    /**
     * List of client-side changes.
     */
    crud: CrudEntry[];
    /**
     * true if there are more changes in the local queue.
     */
    haveMore: boolean;
    /**
     * Call to remove the changes from the local queue, once successfully uploaded.
     */
    complete: (writeCheckpoint?: string) => Promise<void>;
    constructor(
    /**
     * List of client-side changes.
     */
    crud: CrudEntry[], 
    /**
     * true if there are more changes in the local queue.
     */
    haveMore: boolean, 
    /**
     * Call to remove the changes from the local queue, once successfully uploaded.
     */
    complete: (writeCheckpoint?: string) => Promise<void>);
}
