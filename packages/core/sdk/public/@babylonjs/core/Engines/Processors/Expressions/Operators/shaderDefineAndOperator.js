import { ShaderDefineExpression } from "../shaderDefineExpression.js";
/** @internal */
export class ShaderDefineAndOperator extends ShaderDefineExpression {
    isTrue(preprocessors) {
        return this.leftOperand.isTrue(preprocessors) && this.rightOperand.isTrue(preprocessors);
    }
}
//# sourceMappingURL=shaderDefineAndOperator.js.map