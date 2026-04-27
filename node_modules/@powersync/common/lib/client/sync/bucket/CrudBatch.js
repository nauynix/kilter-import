/**
 * A batch of client-side changes.
 */
export class CrudBatch {
    crud;
    haveMore;
    complete;
    constructor(
    /**
     * List of client-side changes.
     */
    crud, 
    /**
     * true if there are more changes in the local queue.
     */
    haveMore, 
    /**
     * Call to remove the changes from the local queue, once successfully uploaded.
     */
    complete) {
        this.crud = crud;
        this.haveMore = haveMore;
        this.complete = complete;
    }
}
//# sourceMappingURL=CrudBatch.js.map