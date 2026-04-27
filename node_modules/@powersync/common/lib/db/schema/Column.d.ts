export declare enum ColumnType {
    TEXT = "TEXT",
    INTEGER = "INTEGER",
    REAL = "REAL"
}
export interface ColumnOptions {
    name: string;
    type?: ColumnType;
}
export type BaseColumnType<T extends number | string | null> = {
    type: ColumnType;
};
export type ColumnsType = Record<string, BaseColumnType<any>>;
export type ExtractColumnValueType<T extends BaseColumnType<any>> = T extends BaseColumnType<infer R> ? R : unknown;
export declare const MAX_AMOUNT_OF_COLUMNS = 1999;
export declare const column: {
    text: BaseColumnType<string | null>;
    integer: BaseColumnType<number | null>;
    real: BaseColumnType<number | null>;
};
export declare class Column {
    protected options: ColumnOptions;
    constructor(options: ColumnOptions);
    get name(): string;
    get type(): ColumnType | undefined;
    toJSON(): {
        name: string;
        type: ColumnType | undefined;
    };
}
