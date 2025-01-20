export class NativePipelineContext {
    get isReady() {
        if (this.compilationError) {
            const message = this.compilationError.message;
            throw new Error("SHADER ERROR" + (typeof message === "string" ? "\n" + message : ""));
        }
        return this.isCompiled;
    }
    _getVertexShaderCode() {
        return null;
    }
    _getFragmentShaderCode() {
        return null;
    }
    constructor(engine, isAsync, shaderProcessingContext) {
        this.isCompiled = false;
        this.vertexBufferKindToType = {};
        this._valueCache = {};
        this._engine = engine;
        this.isAsync = isAsync;
        this.shaderProcessingContext = shaderProcessingContext;
    }
    _fillEffectInformation(effect, uniformBuffersNames, uniformsNames, uniforms, samplerList, samplers, attributesNames, attributes) {
        const engine = this._engine;
        if (engine.supportsUniformBuffers) {
            for (const name in uniformBuffersNames) {
                effect.bindUniformBlock(name, uniformBuffersNames[name]);
            }
        }
        const effectAvailableUniforms = this._engine.getUniforms(this, uniformsNames);
        effectAvailableUniforms.forEach((uniform, index) => {
            uniforms[uniformsNames[index]] = uniform;
        });
        this._uniforms = uniforms;
        let index;
        for (index = 0; index < samplerList.length; index++) {
            const sampler = effect.getUniform(samplerList[index]);
            if (sampler == null) {
                samplerList.splice(index, 1);
                index--;
            }
        }
        samplerList.forEach((name, index) => {
            samplers[name] = index;
        });
        attributes.push(...engine.getAttributes(this, attributesNames));
    }
    setEngine(engine) {
        this._engine = engine;
    }
    /**
     * Release all associated resources.
     **/
    dispose() {
        this._uniforms = {};
    }
    /**
     * @internal
     */
    _cacheMatrix(uniformName, matrix) {
        const cache = this._valueCache[uniformName];
        const flag = matrix.updateFlag;
        if (cache !== undefined && cache === flag) {
            return false;
        }
        this._valueCache[uniformName] = flag;
        return true;
    }
    /**
     * @internal
     */
    _cacheFloat2(uniformName, x, y) {
        let cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y];
            this._valueCache[uniformName] = cache;
            return true;
        }
        let changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        return changed;
    }
    /**
     * @internal
     */
    _cacheFloat3(uniformName, x, y, z) {
        let cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y, z];
            this._valueCache[uniformName] = cache;
            return true;
        }
        let changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        if (cache[2] !== z) {
            cache[2] = z;
            changed = true;
        }
        return changed;
    }
    /**
     * @internal
     */
    _cacheFloat4(uniformName, x, y, z, w) {
        let cache = this._valueCache[uniformName];
        if (!cache) {
            cache = [x, y, z, w];
            this._valueCache[uniformName] = cache;
            return true;
        }
        let changed = false;
        if (cache[0] !== x) {
            cache[0] = x;
            changed = true;
        }
        if (cache[1] !== y) {
            cache[1] = y;
            changed = true;
        }
        if (cache[2] !== z) {
            cache[2] = z;
            changed = true;
        }
        if (cache[3] !== w) {
            cache[3] = w;
            changed = true;
        }
        return changed;
    }
    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    setInt(uniformName, value) {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }
        if (this._engine.setInt(this._uniforms[uniformName], value)) {
            this._valueCache[uniformName] = value;
        }
    }
    /**
     * Sets a int2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     */
    setInt2(uniformName, x, y) {
        if (this._cacheFloat2(uniformName, x, y)) {
            if (!this._engine.setInt2(this._uniforms[uniformName], x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a int3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     */
    setInt3(uniformName, x, y, z) {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this._engine.setInt3(this._uniforms[uniformName], x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a int4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     */
    setInt4(uniformName, x, y, z, w) {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this._engine.setInt4(this._uniforms[uniformName], x, y, z, w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray(this._uniforms[uniformName], array);
    }
    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray2(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray2(this._uniforms[uniformName], array);
    }
    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray3(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray3(this._uniforms[uniformName], array);
    }
    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setIntArray4(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setIntArray4(this._uniforms[uniformName], array);
    }
    /**
     * Sets an unsigned integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    setUInt(uniformName, value) {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }
        if (this._engine.setUInt(this._uniforms[uniformName], value)) {
            this._valueCache[uniformName] = value;
        }
    }
    /**
     * Sets a unsigned int2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint2.
     * @param y Second unsigned int in uint2.
     */
    setUInt2(uniformName, x, y) {
        if (this._cacheFloat2(uniformName, x, y)) {
            if (!this._engine.setUInt2(this._uniforms[uniformName], x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a unsigned int3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint3.
     * @param y Second unsigned int in uint3.
     * @param z Third unsigned int in uint3.
     */
    setUInt3(uniformName, x, y, z) {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this._engine.setUInt3(this._uniforms[uniformName], x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a unsigned int4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint4.
     * @param y Second unsigned int in uint4.
     * @param z Third unsigned int in uint4.
     * @param w Fourth unsigned int in uint4.
     */
    setUInt4(uniformName, x, y, z, w) {
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this._engine.setUInt4(this._uniforms[uniformName], x, y, z, w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets an unsigned int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray(this._uniforms[uniformName], array);
    }
    /**
     * Sets an unsigned int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray2(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray2(this._uniforms[uniformName], array);
    }
    /**
     * Sets an unsigned int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray3(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray3(this._uniforms[uniformName], array);
    }
    /**
     * Sets an unsigned int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setUIntArray4(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setUIntArray4(this._uniforms[uniformName], array);
    }
    /**
     * Sets an float array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setFloatArray(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray(this._uniforms[uniformName], array);
    }
    /**
     * Sets an float array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setFloatArray2(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray2(this._uniforms[uniformName], array);
    }
    /**
     * Sets an float array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setFloatArray3(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray3(this._uniforms[uniformName], array);
    }
    /**
     * Sets an float array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setFloatArray4(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setFloatArray4(this._uniforms[uniformName], array);
    }
    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setArray(this._uniforms[uniformName], array);
    }
    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray2(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setArray2(this._uniforms[uniformName], array);
    }
    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray3(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setArray3(this._uniforms[uniformName], array);
    }
    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    setArray4(uniformName, array) {
        this._valueCache[uniformName] = null;
        this._engine.setArray4(this._uniforms[uniformName], array);
    }
    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     */
    setMatrices(uniformName, matrices) {
        if (!matrices) {
            return;
        }
        this._valueCache[uniformName] = null;
        this._engine.setMatrices(this._uniforms[uniformName], matrices);
    }
    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix(uniformName, matrix) {
        if (this._cacheMatrix(uniformName, matrix)) {
            if (!this._engine.setMatrices(this._uniforms[uniformName], matrix.asArray())) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix3x3(uniformName, matrix) {
        this._valueCache[uniformName] = null;
        this._engine.setMatrix3x3(this._uniforms[uniformName], matrix);
    }
    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    setMatrix2x2(uniformName, matrix) {
        this._valueCache[uniformName] = null;
        this._engine.setMatrix2x2(this._uniforms[uniformName], matrix);
    }
    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     */
    setFloat(uniformName, value) {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === value) {
            return;
        }
        if (this._engine.setFloat(this._uniforms[uniformName], value)) {
            this._valueCache[uniformName] = value;
        }
    }
    /**
     * Sets a boolean on a uniform variable.
     * @param uniformName Name of the variable.
     * @param bool value to be set.
     */
    setBool(uniformName, bool) {
        const cache = this._valueCache[uniformName];
        if (cache !== undefined && cache === bool) {
            return;
        }
        if (this._engine.setInt(this._uniforms[uniformName], bool ? 1 : 0)) {
            this._valueCache[uniformName] = bool ? 1 : 0;
        }
    }
    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    setVector2(uniformName, vector2) {
        if (this._cacheFloat2(uniformName, vector2.x, vector2.y)) {
            if (!this._engine.setFloat2(this._uniforms[uniformName], vector2.x, vector2.y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     */
    setFloat2(uniformName, x, y) {
        if (this._cacheFloat2(uniformName, x, y)) {
            if (!this._engine.setFloat2(this._uniforms[uniformName], x, y)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    setVector3(uniformName, vector3) {
        if (this._cacheFloat3(uniformName, vector3.x, vector3.y, vector3.z)) {
            if (!this._engine.setFloat3(this._uniforms[uniformName], vector3.x, vector3.y, vector3.z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     */
    setFloat3(uniformName, x, y, z) {
        if (this._cacheFloat3(uniformName, x, y, z)) {
            if (!this._engine.setFloat3(this._uniforms[uniformName], x, y, z)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    setVector4(uniformName, vector4) {
        if (this._cacheFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName], vector4.x, vector4.y, vector4.z, vector4.w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a Quaternion on a uniform variable.
     * @param uniformName Name of the variable.
     * @param quaternion Value to be set.
     */
    setQuaternion(uniformName, quaternion) {
        if (this._cacheFloat4(uniformName, quaternion.x, quaternion.y, quaternion.z, quaternion.w)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName], quaternion.x, quaternion.y, quaternion.z, quaternion.w)) {
                this._valueCache[uniformName] = null;
            }
        }
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
        if (this._cacheFloat4(uniformName, x, y, z, w)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName], x, y, z, w)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    setColor3(uniformName, color3) {
        if (this._cacheFloat3(uniformName, color3.r, color3.g, color3.b)) {
            if (!this._engine.setFloat3(this._uniforms[uniformName], color3.r, color3.g, color3.b)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     */
    setColor4(uniformName, color3, alpha) {
        if (this._cacheFloat4(uniformName, color3.r, color3.g, color3.b, alpha)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName], color3.r, color3.g, color3.b, alpha)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    setDirectColor4(uniformName, color4) {
        if (this._cacheFloat4(uniformName, color4.r, color4.g, color4.b, color4.a)) {
            if (!this._engine.setFloat4(this._uniforms[uniformName], color4.r, color4.g, color4.b, color4.a)) {
                this._valueCache[uniformName] = null;
            }
        }
    }
}
//# sourceMappingURL=nativePipelineContext.js.map