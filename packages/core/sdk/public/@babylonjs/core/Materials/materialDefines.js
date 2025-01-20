/**
 * Manages the defines for the Material
 */
export class MaterialDefines {
    /**
     * Creates a new instance
     * @param externalProperties list of external properties to inject into the object
     */
    constructor(externalProperties) {
        /** @internal */
        this._keys = [];
        this._isDirty = true;
        /** @internal */
        this._areLightsDirty = true;
        /** @internal */
        this._areLightsDisposed = false;
        /** @internal */
        this._areAttributesDirty = true;
        /** @internal */
        this._areTexturesDirty = true;
        /** @internal */
        this._areFresnelDirty = true;
        /** @internal */
        this._areMiscDirty = true;
        /** @internal */
        this._arePrePassDirty = true;
        /** @internal */
        this._areImageProcessingDirty = true;
        /** @internal */
        this._normals = false;
        /** @internal */
        this._uvs = false;
        /** @internal */
        this._needNormals = false;
        /** @internal */
        this._needUVs = false;
        this._externalProperties = externalProperties;
        // Initialize External Properties
        if (externalProperties) {
            for (const prop in externalProperties) {
                if (Object.prototype.hasOwnProperty.call(externalProperties, prop)) {
                    this._setDefaultValue(prop);
                }
            }
        }
    }
    /**
     * Specifies if the material needs to be re-calculated
     */
    get isDirty() {
        return this._isDirty;
    }
    /**
     * Marks the material to indicate that it has been re-calculated
     */
    markAsProcessed() {
        this._isDirty = false;
        this._areAttributesDirty = false;
        this._areTexturesDirty = false;
        this._areFresnelDirty = false;
        this._areLightsDirty = false;
        this._areLightsDisposed = false;
        this._areMiscDirty = false;
        this._arePrePassDirty = false;
        this._areImageProcessingDirty = false;
    }
    /**
     * Marks the material to indicate that it needs to be re-calculated
     */
    markAsUnprocessed() {
        this._isDirty = true;
    }
    /**
     * Marks the material to indicate all of its defines need to be re-calculated
     */
    markAllAsDirty() {
        this._areTexturesDirty = true;
        this._areAttributesDirty = true;
        this._areLightsDirty = true;
        this._areFresnelDirty = true;
        this._areMiscDirty = true;
        this._arePrePassDirty = false;
        this._areImageProcessingDirty = true;
        this._isDirty = true;
    }
    /**
     * Marks the material to indicate that image processing needs to be re-calculated
     */
    markAsImageProcessingDirty() {
        this._areImageProcessingDirty = true;
        this._isDirty = true;
    }
    /**
     * Marks the material to indicate the lights need to be re-calculated
     * @param disposed Defines whether the light is dirty due to dispose or not
     */
    markAsLightDirty(disposed = false) {
        this._areLightsDirty = true;
        this._areLightsDisposed = this._areLightsDisposed || disposed;
        this._isDirty = true;
    }
    /**
     * Marks the attribute state as changed
     */
    markAsAttributesDirty() {
        this._areAttributesDirty = true;
        this._isDirty = true;
    }
    /**
     * Marks the texture state as changed
     */
    markAsTexturesDirty() {
        this._areTexturesDirty = true;
        this._isDirty = true;
    }
    /**
     * Marks the fresnel state as changed
     */
    markAsFresnelDirty() {
        this._areFresnelDirty = true;
        this._isDirty = true;
    }
    /**
     * Marks the misc state as changed
     */
    markAsMiscDirty() {
        this._areMiscDirty = true;
        this._isDirty = true;
    }
    /**
     * Marks the prepass state as changed
     */
    markAsPrePassDirty() {
        this._arePrePassDirty = true;
        this._isDirty = true;
    }
    /**
     * Rebuilds the material defines
     */
    rebuild() {
        this._keys.length = 0;
        for (const key of Object.keys(this)) {
            if (key[0] === "_") {
                continue;
            }
            this._keys.push(key);
        }
        if (this._externalProperties) {
            for (const name in this._externalProperties) {
                if (this._keys.indexOf(name) === -1) {
                    this._keys.push(name);
                }
            }
        }
    }
    /**
     * Specifies if two material defines are equal
     * @param other - A material define instance to compare to
     * @returns - Boolean indicating if the material defines are equal (true) or not (false)
     */
    isEqual(other) {
        if (this._keys.length !== other._keys.length) {
            return false;
        }
        for (let index = 0; index < this._keys.length; index++) {
            const prop = this._keys[index];
            if (this[prop] !== other[prop]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Clones this instance's defines to another instance
     * @param other - material defines to clone values to
     */
    cloneTo(other) {
        if (this._keys.length !== other._keys.length) {
            other._keys = this._keys.slice(0);
        }
        for (let index = 0; index < this._keys.length; index++) {
            const prop = this._keys[index];
            other[prop] = this[prop];
        }
    }
    /**
     * Resets the material define values
     */
    reset() {
        this._keys.forEach((prop) => this._setDefaultValue(prop));
    }
    _setDefaultValue(prop) {
        const type = this._externalProperties?.[prop]?.type ?? typeof this[prop];
        const defValue = this._externalProperties?.[prop]?.default;
        switch (type) {
            case "number":
                this[prop] = defValue ?? 0;
                break;
            case "string":
                this[prop] = defValue ?? "";
                break;
            default:
                this[prop] = defValue ?? false;
                break;
        }
    }
    /**
     * Converts the material define values to a string
     * @returns - String of material define information
     */
    toString() {
        let result = "";
        for (let index = 0; index < this._keys.length; index++) {
            const prop = this._keys[index];
            const value = this[prop];
            const type = typeof value;
            switch (type) {
                case "number":
                case "string":
                    result += "#define " + prop + " " + value + "\n";
                    break;
                default:
                    if (value) {
                        result += "#define " + prop + "\n";
                    }
                    break;
            }
        }
        return result;
    }
}
//# sourceMappingURL=materialDefines.js.map