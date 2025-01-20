import { ShaderCodeNode } from "./shaderCodeNode.js";
/** @internal */
export class ShaderCodeTestNode extends ShaderCodeNode {
    isValid(preprocessors) {
        return this.testExpression.isTrue(preprocessors);
    }
}
//# sourceMappingURL=shaderCodeTestNode.js.map