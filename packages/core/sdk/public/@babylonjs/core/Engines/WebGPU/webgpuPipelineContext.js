import { UniformBuffer } from "../../Materials/uniformBuffer.js";
import { WebGPUShaderProcessor } from "./webgpuShaderProcessor.js";
/** @internal */
export class WebGPUPipelineContext {
    get isAsync() {
        return false;
    }
    get isReady() {
        if (this.stages) {
            return true;
        }
        return false;
    }
    constructor(shaderProcessingContext, engine) {
        // The field is indexed by textureState. See @WebGPUMaterialContext.textureState for more information.
        this.bindGroupLayouts = {};
        this._name = "unnamed";
        this.shaderProcessingContext = shaderProcessingContext;
        this._leftOverUniformsByName = {};
        this.engine = engine;
        this.vertexBufferKindToType = {};
    }
    _handlesSpectorRebuildCallback() {
        // Nothing to do yet for spector.
    }
    _fillEffectInformation(effect, uniformBuffersNames, uniformsNames, uniforms, samplerList, samplers, attributesNames, attributes) {
        const engine = this.engine;
        if (engine._doNotHandleContextLost) {
            effect._fragmentSourceCode = "";
            effect._vertexSourceCode = "";
        }
        const foundSamplers = this.shaderProcessingContext.availableTextures;
        let index;
        for (index = 0; index < samplerList.length; index++) {
            const name = samplerList[index];
            const sampler = foundSamplers[samplerList[index]];
            if (sampler == null || sampler == undefined) {
                samplerList.splice(index, 1);
                index--;
            }
            else {
                samplers[name] = index;
            }
        }
        for (const attr of engine.getAttributes(this, attributesNames)) {
            attributes.push(attr);
        }
        // Build the uniform layout for the left over uniforms.
        this.buildUniformLayout();
        const attributeNamesFromEffect = [];
        const attributeLocationsFromEffect = [];
        for (index = 0; index < attributesNames.length; index++) {
            const location = attributes[index];
            if (location >= 0) {
                attributeNamesFromEffect.push(attributesNames[index]);
                attributeLocationsFromEffect.push(location);
            }
        }
        this.shaderProcessingContext.attributeNamesFromEffect = attributeNamesFromEffect;
        this.shaderProcessingContext.attributeLocationsFromEffect = attributeLocationsFromEffect;
    }
    /** @internal */
    /**
     * Build the uniform buffer used in the material.
     */
    buildUniformLayout() {
        if (!this.shaderProcessingContext.leftOverUniforms.length) {
            return;
        }
        this.uniformBuffer?.dispose();
        this.uniformBuffer = new UniformBuffer(this.engine, undefined, undefined, "leftOver-" + this._name);
        for (const leftOverUniform of this.shaderProcessingContext.leftOverUniforms) {
            const type = leftOverUniform.type.replace(/^(.*?)(<.*>)?$/, "$1");
            const size = WebGPUShaderProcessor.UniformSizes[type];
            this.uniformBuffer.addUniform(leftOverUniform.name, size, leftOverUniform.length);
            this._leftOverUniformsByName[leftOverUniform.name] = leftOverUniform.type;
        }
        this.uniformBuffer.create();
    }
    setEngine(engine) {
        this.engine = engine;
    }
    /**
     * Release all associated resources.
     **/
    dispose() {
        if (this.uniformBuffer) {
            this.uniformBuffer.dispose();
        }
    }
    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    setInt(uniformName, value) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt(uniformName, value);
    }
    /**
     * Sets an int2 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     */
    setInt2(uniformName, x, y) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt2(uniformName, x, y);
    }
    /**
     * Sets an int3 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     */
    setInt3(uniformName, x, y, z) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt3(uniformName, x, y, z);
    }
    /**
     * Sets an int4 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     */
    setInt4(uniformName, x, y, z, w) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt4(uniformName, x, y, z, w);
    }
    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray(uniformName, array) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateIntArray(uniformName, array);
    }
    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray2(uniformName, array) {
        this.setIntArray(uniformName, array);
    }
    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray3(uniformName, array) {
        this.setIntArray(uniformName, array);
    }
    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray4(uniformName, array) {
        this.setIntArray(uniformName, array);
    }
    /**
     * Sets an unsigned integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    setUInt(uniformName, value) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateUInt(uniformName, value);
    }
    /**
     * Sets an unsigned int2 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint2.
     * @param y Second unsigned int in uint2.
     */
    setUInt2(uniformName, x, y) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateUInt2(uniformName, x, y);
    }
    /**
     * Sets an unsigned int3 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint3.
     * @param y Second unsigned int in uint3.
     * @param z Third unsigned int in uint3.
     */
    setUInt3(uniformName, x, y, z) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateUInt3(uniformName, x, y, z);
    }
    /**
     * Sets an unsigned int4 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint4.
     * @param y Second unsigned int in uint4.
     * @param z Third unsigned int in uint4.
     * @param w Fourth unsigned int in uint4.
     */
    setUInt4(uniformName, x, y, z, w) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateUInt4(uniformName, x, y, z, w);
    }
    /**
     * Sets an unsigned int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray(uniformName, array) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateUIntArray(uniformName, array);
    }
    /**
     * Sets an unsigned int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray2(uniformName, array) {
        this.setUIntArray(uniformName, array);
    }
    /**
     * Sets an unsigned int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray3(uniformName, array) {
        this.setUIntArray(uniformName, array);
    }
    /**
     * Sets an unsigned int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray4(uniformName, array) {
        this.setUIntArray(uniformName, array);
    }
    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray(uniformName, array) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateArray(uniformName, array);
    }
    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray2(uniformName, array) {
        this.setArray(uniformName, array);
    }
    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray3(uniformName, array) {
        this.setArray(uniformName, array);
    }
    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray4(uniformName, array) {
        this.setArray(uniformName, array);
    }
    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     */
    setMatrices(uniformName, matrices) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrices(uniformName, matrices);
    }
    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix(uniformName, matrix) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrix(uniformName, matrix);
    }
    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix3x3(uniformName, matrix) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrix3x3(uniformName, matrix);
    }
    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix2x2(uniformName, matrix) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrix2x2(uniformName, matrix);
    }
    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     */
    setFloat(uniformName, value) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat(uniformName, value);
    }
    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    setVector2(uniformName, vector2) {
        this.setFloat2(uniformName, vector2.x, vector2.y);
    }
    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     */
    setFloat2(uniformName, x, y) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat2(uniformName, x, y);
    }
    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    setVector3(uniformName, vector3) {
        this.setFloat3(uniformName, vector3.x, vector3.y, vector3.z);
    }
    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     */
    setFloat3(uniformName, x, y, z) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat3(uniformName, x, y, z);
    }
    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    setVector4(uniformName, vector4) {
        this.setFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w);
    }
    /**
     * Sets a Quaternion on a uniform variable.
     * @param uniformName Name of the variable.
     * @param quaternion Value to be set.
     */
    setQuaternion(uniformName, quaternion) {
        this.setFloat4(uniformName, quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }
    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     */
    setFloat4(uniformName, x, y, z, w) {
        if (!this.uniformBuffer || !this._leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat4(uniformName, x, y, z, w);
    }
    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    setColor3(uniformName, color3) {
        this.setFloat3(uniformName, color3.r, color3.g, color3.b);
    }
    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     */
    setColor4(uniformName, color3, alpha) {
        this.setFloat4(uniformName, color3.r, color3.g, color3.b, alpha);
    }
    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    setDirectColor4(uniformName, color4) {
        this.setFloat4(uniformName, color4.r, color4.g, color4.b, color4.a);
    }
    _getVertexShaderCode() {
        return this.sources?.vertex;
    }
    _getFragmentShaderCode() {
        return this.sources?.fragment;
    }
}
//# sourceMappingURL=webgpuPipelineContext.js.map