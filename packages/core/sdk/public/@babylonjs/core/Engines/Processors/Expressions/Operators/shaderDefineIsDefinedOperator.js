import { ShaderDefineExpression } from "../shaderDefineExpression.js";
/** @internal */
export class ShaderDefineIsDefinedOperator extends ShaderDefineExpression {
    constructor(define, not = false) {
        super();
        this.define = define;
        this.not = not;
    }
    isTrue(preprocessors) {
        let condition = preprocessors[this.define] !== undefined;
        if (this.not) {
            condition = !condition;
        }
        return condition;
    }
}
//# sourceMappingURL=shaderDefineIsDefinedOperator.js.map