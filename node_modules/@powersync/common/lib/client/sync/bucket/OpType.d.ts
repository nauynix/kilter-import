export declare enum OpTypeEnum {
    CLEAR = 1,
    MOVE = 2,
    PUT = 3,
    REMOVE = 4
}
export type OpTypeJSON = string;
/**
 * Used internally for sync buckets.
 */
export declare class OpType {
    value: OpTypeEnum;
    static fromJSON(jsonValue: OpTypeJSON): OpType;
    constructor(value: OpTypeEnum);
    toJSON(): string;
}
