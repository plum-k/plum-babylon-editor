import { __decorate } from "../tslib.es6.js";
import { serialize, expandToProperty, serializeAsTexture } from "../Misc/decorators.js";
import { Vector4 } from "../Maths/math.vector.js";
import { EngineStore } from "../Engines/engineStore.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
/**
 * This class is used to animate meshes using a baked vertex animation texture
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/baked_texture_animations
 * @since 5.0
 */
export class BakedVertexAnimationManager {
    /**
     * Creates a new BakedVertexAnimationManager
     * @param scene defines the current scene
     */
    constructor(scene) {
        this._texture = null;
        this._isEnabled = true;
        /**
         * Enable or disable the vertex animation manager
         */
        this.isEnabled = true;
        /**
         * The time counter, to pick the correct animation frame.
         */
        this.time = 0;
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;
        this.animationParameters = new Vector4(0, 0, 0, 30);
    }
    /** @internal */
    _markSubMeshesAsAttributesDirty() {
        for (const mesh of this._scene.meshes) {
            if (mesh.bakedVertexAnimationManager === this) {
                mesh._markSubMeshesAsAttributesDirty();
            }
        }
    }
    /**
     * Binds to the effect.
     * @param effect The effect to bind to.
     * @param useInstances True when it's an instance.
     */
    bind(effect, useInstances = false) {
        if (!this._texture || !this._isEnabled) {
            return;
        }
        const size = this._texture.getSize();
        effect.setFloat2("bakedVertexAnimationTextureSizeInverted", 1.0 / size.width, 1.0 / size.height);
        effect.setFloat("bakedVertexAnimationTime", this.time);
        if (!useInstances) {
            effect.setVector4("bakedVertexAnimationSettings", this.animationParameters);
        }
        effect.setTexture("bakedVertexAnimationTexture", this._texture);
    }
    /**
     * Clone the current manager
     * @returns a new BakedVertexAnimationManager
     */
    clone() {
        const copy = new BakedVertexAnimationManager(this._scene);
        this.copyTo(copy);
        return copy;
    }
    /**
     * Sets animation parameters.
     * @param startFrame The first frame of the animation.
     * @param endFrame The last frame of the animation.
     * @param offset The offset when starting the animation.
     * @param speedFramesPerSecond The frame rate.
     */
    setAnimationParameters(startFrame, endFrame, offset = 0, speedFramesPerSecond = 30) {
        this.animationParameters = new Vector4(startFrame, endFrame, offset, speedFramesPerSecond);
    }
    /**
     * Disposes the resources of the manager.
     * @param forceDisposeTextures - Forces the disposal of all textures.
     */
    dispose(forceDisposeTextures) {
        if (forceDisposeTextures) {
            this._texture?.dispose();
        }
    }
    /**
     * Get the current class name useful for serialization or dynamic coding.
     * @returns "BakedVertexAnimationManager"
     */
    getClassName() {
        return "BakedVertexAnimationManager";
    }
    /**
     * Makes a duplicate of the current instance into another one.
     * @param vatMap define the instance where to copy the info
     */
    copyTo(vatMap) {
        SerializationHelper.Clone(() => vatMap, this);
    }
    /**
     * Serializes this vertex animation instance
     * @returns - An object with the serialized instance.
     */
    serialize() {
        return SerializationHelper.Serialize(this);
    }
    /**
     * Parses a vertex animation setting from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    parse(source, scene, rootUrl) {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
__decorate([
    serializeAsTexture(),
    expandToProperty("_markSubMeshesAsAttributesDirty")
], BakedVertexAnimationManager.prototype, "texture", void 0);
__decorate([
    serialize(),
    expandToProperty("_markSubMeshesAsAttributesDirty")
], BakedVertexAnimationManager.prototype, "isEnabled", void 0);
__decorate([
    serialize()
], BakedVertexAnimationManager.prototype, "animationParameters", void 0);
__decorate([
    serialize()
], BakedVertexAnimationManager.prototype, "time", void 0);
//# sourceMappingURL=bakedVertexAnimationManager.js.map