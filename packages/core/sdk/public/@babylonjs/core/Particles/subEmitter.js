import { Vector3 } from "../Maths/math.vector.js";
import { _WarnImport } from "../Misc/devTools.js";
import { GetClass } from "../Misc/typeStore.js";
/**
 * Type of sub emitter
 */
export var SubEmitterType;
(function (SubEmitterType) {
    /**
     * Attached to the particle over it's lifetime
     */
    SubEmitterType[SubEmitterType["ATTACHED"] = 0] = "ATTACHED";
    /**
     * Created when the particle dies
     */
    SubEmitterType[SubEmitterType["END"] = 1] = "END";
})(SubEmitterType || (SubEmitterType = {}));
/**
 * Sub emitter class used to emit particles from an existing particle
 */
export class SubEmitter {
    /**
     * Creates a sub emitter
     * @param particleSystem the particle system to be used by the sub emitter
     */
    constructor(
    /**
     * the particle system to be used by the sub emitter
     */
    particleSystem) {
        this.particleSystem = particleSystem;
        /**
         * Type of the submitter (Default: END)
         */
        this.type = 1 /* SubEmitterType.END */;
        /**
         * If the particle should inherit the direction from the particle it's attached to. (+Y will face the direction the particle is moving) (Default: false)
         * Note: This only is supported when using an emitter of type Mesh
         */
        this.inheritDirection = false;
        /**
         * How much of the attached particles speed should be added to the sub emitted particle (default: 0)
         */
        this.inheritedVelocityAmount = 0;
        // Create mesh as emitter to support rotation
        if (!particleSystem.emitter || !particleSystem.emitter.dispose) {
            const internalClass = GetClass("BABYLON.AbstractMesh");
            particleSystem.emitter = new internalClass("SubemitterSystemEmitter", particleSystem.getScene());
            particleSystem._disposeEmitterOnDispose = true;
        }
    }
    /**
     * Clones the sub emitter
     * @returns the cloned sub emitter
     */
    clone() {
        // Clone particle system
        let emitter = this.particleSystem.emitter;
        if (!emitter) {
            emitter = new Vector3();
        }
        else if (emitter instanceof Vector3) {
            emitter = emitter.clone();
        }
        else if (emitter.getClassName().indexOf("Mesh") !== -1) {
            const internalClass = GetClass("BABYLON.Mesh");
            emitter = new internalClass("", emitter.getScene());
            emitter.isVisible = false;
        }
        const clone = new SubEmitter(this.particleSystem.clone(this.particleSystem.name, emitter));
        // Clone properties
        clone.particleSystem.name += "Clone";
        clone.type = this.type;
        clone.inheritDirection = this.inheritDirection;
        clone.inheritedVelocityAmount = this.inheritedVelocityAmount;
        clone.particleSystem._disposeEmitterOnDispose = true;
        clone.particleSystem.disposeOnStop = true;
        return clone;
    }
    /**
     * Serialize current object to a JSON object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns the serialized object
     */
    serialize(serializeTexture = false) {
        const serializationObject = {};
        serializationObject.type = this.type;
        serializationObject.inheritDirection = this.inheritDirection;
        serializationObject.inheritedVelocityAmount = this.inheritedVelocityAmount;
        serializationObject.particleSystem = this.particleSystem.serialize(serializeTexture);
        return serializationObject;
    }
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _ParseParticleSystem(system, sceneOrEngine, rootUrl, doNotStart = false) {
        throw _WarnImport("ParseParticle");
    }
    /**
     * Creates a new SubEmitter from a serialized JSON version
     * @param serializationObject defines the JSON object to read from
     * @param sceneOrEngine defines the hosting scene or the hosting engine
     * @param rootUrl defines the rootUrl for data loading
     * @returns a new SubEmitter
     */
    static Parse(serializationObject, sceneOrEngine, rootUrl) {
        const system = serializationObject.particleSystem;
        const subEmitter = new SubEmitter(SubEmitter._ParseParticleSystem(system, sceneOrEngine, rootUrl, true));
        subEmitter.type = serializationObject.type;
        subEmitter.inheritDirection = serializationObject.inheritDirection;
        subEmitter.inheritedVelocityAmount = serializationObject.inheritedVelocityAmount;
        subEmitter.particleSystem._isSubEmitter = true;
        return subEmitter;
    }
    /** Release associated resources */
    dispose() {
        this.particleSystem.dispose();
    }
}
//# sourceMappingURL=subEmitter.js.map