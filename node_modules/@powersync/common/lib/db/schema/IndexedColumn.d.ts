import { ColumnType } from './Column.js';
import { Table } from './Table.js';
export interface IndexColumnOptions {
    name: string;
    ascending?: boolean;
}
export declare const DEFAULT_INDEX_COLUMN_OPTIONS: Partial<IndexColumnOptions>;
export declare class IndexedColumn {
    protected options: IndexColumnOptions;
    static createAscending(column: string): IndexedColumn;
    constructor(options: IndexColumnOptions);
    get name(): string;
    get ascending(): boolean | undefined;
    toJSON(table: Table): {
        name: string;
        ascending: boolean | undefined;
        type: ColumnType;
    };
}
