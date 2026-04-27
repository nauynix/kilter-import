import { AbstractPowerSyncDatabase, SQLWatchOptions } from './AbstractPowerSyncDatabase.js';
export declare function runOnSchemaChange(callback: (signal: AbortSignal) => void, db: AbstractPowerSyncDatabase, options?: SQLWatchOptions): void;
