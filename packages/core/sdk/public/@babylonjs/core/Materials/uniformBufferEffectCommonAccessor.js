/** @internal */
export class UniformBufferEffectCommonAccessor {
    _isUbo(uboOrEffect) {
        return uboOrEffect.addUniform !== undefined;
    }
    constructor(uboOrEffect) {
        if (this._isUbo(uboOrEffect)) {
            this.setMatrix3x3 = uboOrEffect.updateMatrix3x3.bind(uboOrEffect);
            this.setMatrix2x2 = uboOrEffect.updateMatrix2x2.bind(uboOrEffect);
            this.setFloat = uboOrEffect.updateFloat.bind(uboOrEffect);
            this.setFloat2 = uboOrEffect.updateFloat2.bind(uboOrEffect);
            this.setFloat3 = uboOrEffect.updateFloat3.bind(uboOrEffect);
            this.setFloat4 = uboOrEffect.updateFloat4.bind(uboOrEffect);
            this.setFloatArray = uboOrEffect.updateFloatArray.bind(uboOrEffect);
            this.setArray = uboOrEffect.updateArray.bind(uboOrEffect);
            this.setIntArray = uboOrEffect.updateIntArray.bind(uboOrEffect);
            this.setMatrix = uboOrEffect.updateMatrix.bind(uboOrEffect);
            this.setMatrices = uboOrEffect.updateMatrices.bind(uboOrEffect);
            this.setVector3 = uboOrEffect.updateVector3.bind(uboOrEffect);
            this.setVector4 = uboOrEffect.updateVector4.bind(uboOrEffect);
            this.setColor3 = uboOrEffect.updateColor3.bind(uboOrEffect);
            this.setColor4 = uboOrEffect.updateColor4.bind(uboOrEffect);
            this.setDirectColor4 = uboOrEffect.updateDirectColor4.bind(uboOrEffect);
            this.setInt = uboOrEffect.updateInt.bind(uboOrEffect);
            this.setInt2 = uboOrEffect.updateInt2.bind(uboOrEffect);
            this.setInt3 = uboOrEffect.updateInt3.bind(uboOrEffect);
            this.setInt4 = uboOrEffect.updateInt4.bind(uboOrEffect);
        }
        else {
            this.setMatrix3x3 = uboOrEffect.setMatrix3x3.bind(uboOrEffect);
            this.setMatrix2x2 = uboOrEffect.setMatrix2x2.bind(uboOrEffect);
            this.setFloat = uboOrEffect.setFloat.bind(uboOrEffect);
            this.setFloat2 = uboOrEffect.setFloat2.bind(uboOrEffect);
            this.setFloat3 = uboOrEffect.setFloat3.bind(uboOrEffect);
            this.setFloat4 = uboOrEffect.setFloat4.bind(uboOrEffect);
            this.setFloatArray = uboOrEffect.setFloatArray.bind(uboOrEffect);
            this.setArray = uboOrEffect.setArray.bind(uboOrEffect);
            this.setIntArray = uboOrEffect.setIntArray.bind(uboOrEffect);
            this.setMatrix = uboOrEffect.setMatrix.bind(uboOrEffect);
            this.setMatrices = uboOrEffect.setMatrices.bind(uboOrEffect);
            this.setVector3 = uboOrEffect.setVector3.bind(uboOrEffect);
            this.setVector4 = uboOrEffect.setVector4.bind(uboOrEffect);
            this.setColor3 = uboOrEffect.setColor3.bind(uboOrEffect);
            this.setColor4 = uboOrEffect.setColor4.bind(uboOrEffect);
            this.setDirectColor4 = uboOrEffect.setDirectColor4.bind(uboOrEffect);
            this.setInt = uboOrEffect.setInt.bind(uboOrEffect);
            this.setInt2 = uboOrEffect.setInt2.bind(uboOrEffect);
            this.setInt3 = uboOrEffect.setInt3.bind(uboOrEffect);
            this.setInt4 = uboOrEffect.setInt4.bind(uboOrEffect);
        }
    }
}
//# sourceMappingURL=uniformBufferEffectCommonAccessor.js.map