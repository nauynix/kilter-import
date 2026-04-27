import { CrudBatch } from './CrudBatch.js';
import { CrudEntry } from './CrudEntry.js';
export declare class CrudTransaction extends CrudBatch {
    /**
     * List of client-side changes.
     */
    crud: CrudEntry[];
    /**
     * Call to remove the changes from the local queue, once successfully uploaded.
     */
    complete: (checkpoint?: string) => Promise<void>;
    /**
     * If null, this contains a list of changes recorded without an explicit transaction associated.
     */
    transactionId?: number | undefined;
    constructor(
    /**
     * List of client-side changes.
     */
    crud: CrudEntry[], 
    /**
     * Call to remove the changes from the local queue, once successfully uploaded.
     */
    complete: (checkpoint?: string) => Promise<void>, 
    /**
     * If null, this contains a list of changes recorded without an explicit transaction associated.
     */
    transactionId?: number | undefined);
}
