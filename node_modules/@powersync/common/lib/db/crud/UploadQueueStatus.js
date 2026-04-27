export class UploadQueueStats {
    count;
    size;
    constructor(
    /**
     * Number of records in the upload queue.
     */
    count, 
    /**
     * Size of the upload queue in bytes.
     */
    size = null) {
        this.count = count;
        this.size = size;
    }
    toString() {
        if (this.size == null) {
            return `UploadQueueStats<count:${this.count}>`;
        }
        else {
            return `UploadQueueStats<count: $count size: ${this.size / 1024}kB>`;
        }
    }
}
//# sourceMappingURL=UploadQueueStatus.js.map