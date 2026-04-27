import { SyncDataBucket } from './SyncDataBucket.js';
export declare class SyncDataBatch {
    buckets: SyncDataBucket[];
    static fromJSON(json: any): SyncDataBatch;
    constructor(buckets: SyncDataBucket[]);
}
