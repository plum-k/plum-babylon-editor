import { RichTypeBoolean } from "../../../flowGraphRichTypes.js";
import { FlowGraphBinaryOperationBlock } from "../flowGraphBinaryOperationBlock.js";
import { FlowGraphUnaryOperationBlock } from "../flowGraphUnaryOperationBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
const PREFIX = "FGLogic";
const AND = "AndBlock";
const OR = "OrBlock";
const NOT = "NotBlock";
/**
 * Performs an AND operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicAndBlock extends FlowGraphBinaryOperationBlock {
    constructor(config) {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left && right, `${PREFIX}${AND}`, config);
    }
}
RegisterClass(`${PREFIX}${AND}`, FlowGraphLogicAndBlock);
/**
 * Performs an OR operation on two boolean values.
 * @experimental
 */
export class FlowGraphLogicOrBlock extends FlowGraphBinaryOperationBlock {
    constructor(config) {
        super(RichTypeBoolean, RichTypeBoolean, RichTypeBoolean, (left, right) => left || right, `${PREFIX}${OR}`, config);
    }
}
RegisterClass(`${PREFIX}${OR}`, FlowGraphLogicOrBlock);
/**
 * Performs a NOT operation on a boolean value
 * @experimental
 */
export class FlowGraphLogicNotBlock extends FlowGraphUnaryOperationBlock {
    constructor(config) {
        super(RichTypeBoolean, RichTypeBoolean, (value) => !value, `${PREFIX}${NOT}`, config);
    }
}
RegisterClass(`${PREFIX}${NOT}`, FlowGraphLogicNotBlock);
//# sourceMappingURL=flowGraphLogicBlocks.js.map