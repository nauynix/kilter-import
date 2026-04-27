import { CompilableQuery } from './../types/types.js';
import { AbstractPowerSyncDatabase, SQLWatchOptions } from './AbstractPowerSyncDatabase.js';
export interface CompilableQueryWatchHandler<T> {
    onResult: (results: T[]) => void;
    onError?: (error: Error) => void;
}
export declare function compilableQueryWatch<T>(db: AbstractPowerSyncDatabase, query: CompilableQuery<T>, handler: CompilableQueryWatchHandler<T>, options?: SQLWatchOptions): void;
