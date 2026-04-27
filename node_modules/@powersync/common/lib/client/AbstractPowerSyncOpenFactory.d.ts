import { DBAdapter } from '../db/DBAdapter.js';
import { Schema } from '../db/schema/Schema.js';
import { AbstractPowerSyncDatabase, PowerSyncDatabaseOptions } from './AbstractPowerSyncDatabase.js';
import { SQLOpenOptions } from './SQLOpenFactory.js';
export interface PowerSyncOpenFactoryOptions extends Partial<PowerSyncDatabaseOptions>, SQLOpenOptions {
    /** Schema used for the local database. */
    schema: Schema;
}
export declare abstract class AbstractPowerSyncDatabaseOpenFactory {
    protected options: PowerSyncOpenFactoryOptions;
    constructor(options: PowerSyncOpenFactoryOptions);
    /**
     * Schema used for the local database.
     */
    get schema(): Schema<{
        [x: string]: import("../index.js").Table<any>;
    }>;
    protected abstract openDB(): DBAdapter;
    generateOptions(): PowerSyncDatabaseOptions;
    abstract generateInstance(options: PowerSyncDatabaseOptions): AbstractPowerSyncDatabase;
    getInstance(): AbstractPowerSyncDatabase;
}
