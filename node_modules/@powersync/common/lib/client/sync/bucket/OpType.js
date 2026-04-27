export var OpTypeEnum;
(function (OpTypeEnum) {
    OpTypeEnum[OpTypeEnum["CLEAR"] = 1] = "CLEAR";
    OpTypeEnum[OpTypeEnum["MOVE"] = 2] = "MOVE";
    OpTypeEnum[OpTypeEnum["PUT"] = 3] = "PUT";
    OpTypeEnum[OpTypeEnum["REMOVE"] = 4] = "REMOVE";
})(OpTypeEnum || (OpTypeEnum = {}));
/**
 * Used internally for sync buckets.
 */
export class OpType {
    value;
    static fromJSON(jsonValue) {
        return new OpType(OpTypeEnum[jsonValue]);
    }
    constructor(value) {
        this.value = value;
    }
    toJSON() {
        return Object.entries(OpTypeEnum).find(([, value]) => value === this.value)[0];
    }
}
//# sourceMappingURL=OpType.js.map