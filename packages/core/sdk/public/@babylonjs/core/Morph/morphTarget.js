import { __decorate } from "../tslib.es6.js";
import { Observable } from "../Misc/observable.js";
import { EngineStore } from "../Engines/engineStore.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { GetClass } from "../Misc/typeStore.js";
/**
 * Defines a target to use with MorphTargetManager
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/morphTargets
 */
export class MorphTarget {
    /**
     * Gets or sets the influence of this target (ie. its weight in the overall morphing)
     */
    get influence() {
        return this._influence;
    }
    set influence(influence) {
        if (this._influence === influence) {
            return;
        }
        const previous = this._influence;
        this._influence = influence;
        if (this.onInfluenceChanged.hasObservers()) {
            this.onInfluenceChanged.notifyObservers(previous === 0 || influence === 0);
        }
    }
    /**
     * Gets or sets the animation properties override
     */
    get animationPropertiesOverride() {
        if (!this._animationPropertiesOverride && this._scene) {
            return this._scene.animationPropertiesOverride;
        }
        return this._animationPropertiesOverride;
    }
    set animationPropertiesOverride(value) {
        this._animationPropertiesOverride = value;
    }
    /**
     * Creates a new MorphTarget
     * @param name defines the name of the target
     * @param influence defines the influence to use
     * @param scene defines the scene the morphtarget belongs to
     */
    constructor(
    /** defines the name of the target */
    name, influence = 0, scene = null) {
        this.name = name;
        /**
         * Gets or sets the list of animations
         */
        this.animations = [];
        this._positions = null;
        this._normals = null;
        this._tangents = null;
        this._uvs = null;
        this._uv2s = null;
        this._uniqueId = 0;
        /**
         * Observable raised when the influence changes
         */
        this.onInfluenceChanged = new Observable();
        /** @internal */
        this._onDataLayoutChanged = new Observable();
        this._animationPropertiesOverride = null;
        this.id = name;
        this._scene = scene || EngineStore.LastCreatedScene;
        this.influence = influence;
        if (this._scene) {
            this._uniqueId = this._scene.getUniqueId();
        }
    }
    /**
     * Gets the unique ID of this manager
     */
    get uniqueId() {
        return this._uniqueId;
    }
    /**
     * Gets a boolean defining if the target contains position data
     */
    get hasPositions() {
        return !!this._positions;
    }
    /**
     * Gets a boolean defining if the target contains normal data
     */
    get hasNormals() {
        return !!this._normals;
    }
    /**
     * Gets a boolean defining if the target contains tangent data
     */
    get hasTangents() {
        return !!this._tangents;
    }
    /**
     * Gets a boolean defining if the target contains texture coordinates data
     */
    get hasUVs() {
        return !!this._uvs;
    }
    /**
     * Gets a boolean defining if the target contains texture coordinates 2 data
     */
    get hasUV2s() {
        return !!this._uv2s;
    }
    /**
     * Gets the number of vertices stored in this target
     */
    get vertexCount() {
        return this._positions
            ? this._positions.length / 3
            : this._normals
                ? this._normals.length / 3
                : this._tangents
                    ? this._tangents.length / 3
                    : this._uvs
                        ? this._uvs.length / 2
                        : this._uv2s
                            ? this._uv2s.length / 2
                            : 0;
    }
    /**
     * Affects position data to this target
     * @param data defines the position data to use
     */
    setPositions(data) {
        const hadPositions = this.hasPositions;
        this._positions = data;
        if (hadPositions !== this.hasPositions) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }
    /**
     * Gets the position data stored in this target
     * @returns a FloatArray containing the position data (or null if not present)
     */
    getPositions() {
        return this._positions;
    }
    /**
     * Affects normal data to this target
     * @param data defines the normal data to use
     */
    setNormals(data) {
        const hadNormals = this.hasNormals;
        this._normals = data;
        if (hadNormals !== this.hasNormals) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }
    /**
     * Gets the normal data stored in this target
     * @returns a FloatArray containing the normal data (or null if not present)
     */
    getNormals() {
        return this._normals;
    }
    /**
     * Affects tangent data to this target
     * @param data defines the tangent data to use
     */
    setTangents(data) {
        const hadTangents = this.hasTangents;
        this._tangents = data;
        if (hadTangents !== this.hasTangents) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }
    /**
     * Gets the tangent data stored in this target
     * @returns a FloatArray containing the tangent data (or null if not present)
     */
    getTangents() {
        return this._tangents;
    }
    /**
     * Affects texture coordinates data to this target
     * @param data defines the texture coordinates data to use
     */
    setUVs(data) {
        const hadUVs = this.hasUVs;
        this._uvs = data;
        if (hadUVs !== this.hasUVs) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }
    /**
     * Gets the texture coordinates data stored in this target
     * @returns a FloatArray containing the texture coordinates data (or null if not present)
     */
    getUVs() {
        return this._uvs;
    }
    /**
     * Affects texture coordinates 2 data to this target
     * @param data defines the texture coordinates 2 data to use
     */
    setUV2s(data) {
        const hadUV2s = this.hasUV2s;
        this._uv2s = data;
        if (hadUV2s !== this.hasUV2s) {
            this._onDataLayoutChanged.notifyObservers(undefined);
        }
    }
    /**
     * Gets the texture coordinates 2 data stored in this target
     * @returns a FloatArray containing the texture coordinates 2 data (or null if not present)
     */
    getUV2s() {
        return this._uv2s;
    }
    /**
     * Clone the current target
     * @returns a new MorphTarget
     */
    clone() {
        const newOne = SerializationHelper.Clone(() => new MorphTarget(this.name, this.influence, this._scene), this);
        newOne._positions = this._positions;
        newOne._normals = this._normals;
        newOne._tangents = this._tangents;
        newOne._uvs = this._uvs;
        newOne._uv2s = this._uv2s;
        return newOne;
    }
    /**
     * Serializes the current target into a Serialization object
     * @returns the serialized object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.name = this.name;
        serializationObject.influence = this.influence;
        serializationObject.positions = Array.prototype.slice.call(this.getPositions());
        if (this.id != null) {
            serializationObject.id = this.id;
        }
        if (this.hasNormals) {
            serializationObject.normals = Array.prototype.slice.call(this.getNormals());
        }
        if (this.hasTangents) {
            serializationObject.tangents = Array.prototype.slice.call(this.getTangents());
        }
        if (this.hasUVs) {
            serializationObject.uvs = Array.prototype.slice.call(this.getUVs());
        }
        if (this.hasUV2s) {
            serializationObject.uv2s = Array.prototype.slice.call(this.getUV2s());
        }
        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
        return serializationObject;
    }
    /**
     * Returns the string "MorphTarget"
     * @returns "MorphTarget"
     */
    getClassName() {
        return "MorphTarget";
    }
    // Statics
    /**
     * Creates a new target from serialized data
     * @param serializationObject defines the serialized data to use
     * @param scene defines the hosting scene
     * @returns a new MorphTarget
     */
    static Parse(serializationObject, scene) {
        const result = new MorphTarget(serializationObject.name, serializationObject.influence);
        result.setPositions(serializationObject.positions);
        if (serializationObject.id != null) {
            result.id = serializationObject.id;
        }
        if (serializationObject.normals) {
            result.setNormals(serializationObject.normals);
        }
        if (serializationObject.tangents) {
            result.setTangents(serializationObject.tangents);
        }
        if (serializationObject.uvs) {
            result.setUVs(serializationObject.uvs);
        }
        if (serializationObject.uv2s) {
            result.setUV2s(serializationObject.uv2s);
        }
        // Animations
        if (serializationObject.animations) {
            for (let animationIndex = 0; animationIndex < serializationObject.animations.length; animationIndex++) {
                const parsedAnimation = serializationObject.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    result.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
            if (serializationObject.autoAnimate && scene) {
                scene.beginAnimation(result, serializationObject.autoAnimateFrom, serializationObject.autoAnimateTo, serializationObject.autoAnimateLoop, serializationObject.autoAnimateSpeed || 1.0);
            }
        }
        return result;
    }
    /**
     * Creates a MorphTarget from mesh data
     * @param mesh defines the source mesh
     * @param name defines the name to use for the new target
     * @param influence defines the influence to attach to the target
     * @returns a new MorphTarget
     */
    static FromMesh(mesh, name, influence) {
        if (!name) {
            name = mesh.name;
        }
        const result = new MorphTarget(name, influence, mesh.getScene());
        result.setPositions(mesh.getVerticesData(VertexBuffer.PositionKind));
        if (mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            result.setNormals(mesh.getVerticesData(VertexBuffer.NormalKind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
            result.setTangents(mesh.getVerticesData(VertexBuffer.TangentKind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
            result.setUVs(mesh.getVerticesData(VertexBuffer.UVKind));
        }
        if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
            result.setUV2s(mesh.getVerticesData(VertexBuffer.UV2Kind));
        }
        return result;
    }
}
__decorate([
    serialize()
], MorphTarget.prototype, "id", void 0);
//# sourceMappingURL=morphTarget.js.map