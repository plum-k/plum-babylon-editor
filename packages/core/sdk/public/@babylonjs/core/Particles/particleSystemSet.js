import { Color3 } from "../Maths/math.color.js";
import { CreateSphere } from "../Meshes/Builders/sphereBuilder.js";
import { GPUParticleSystem } from "./gpuParticleSystem.js";
import { EngineStore } from "../Engines/engineStore.js";
import { ParticleSystem } from "../Particles/particleSystem.js";
import { StandardMaterial } from "../Materials/standardMaterial.js";
/** Internal class used to store shapes for emitters */
class ParticleSystemSetEmitterCreationOptions {
}
/**
 * Represents a set of particle systems working together to create a specific effect
 */
export class ParticleSystemSet {
    constructor() {
        this._emitterNodeIsOwned = true;
        /**
         * Gets the particle system list
         */
        this.systems = [];
    }
    /**
     * Gets or sets the emitter node used with this set
     */
    get emitterNode() {
        return this._emitterNode;
    }
    set emitterNode(value) {
        if (this._emitterNodeIsOwned && this._emitterNode) {
            if (this._emitterNode.dispose) {
                this._emitterNode.dispose();
            }
            this._emitterNodeIsOwned = false;
        }
        for (const system of this.systems) {
            system.emitter = value;
        }
        this._emitterNode = value;
    }
    /**
     * Creates a new emitter mesh as a sphere
     * @param options defines the options used to create the sphere
     * @param options.diameter
     * @param options.segments
     * @param options.color
     * @param renderingGroupId defines the renderingGroupId to use for the sphere
     * @param scene defines the hosting scene
     */
    setEmitterAsSphere(options, renderingGroupId, scene) {
        if (this._emitterNodeIsOwned && this._emitterNode) {
            if (this._emitterNode.dispose) {
                this._emitterNode.dispose();
            }
        }
        this._emitterNodeIsOwned = true;
        this._emitterCreationOptions = {
            kind: "Sphere",
            options: options,
            renderingGroupId: renderingGroupId,
        };
        const emitterMesh = CreateSphere("emitterSphere", { diameter: options.diameter, segments: options.segments }, scene);
        emitterMesh.renderingGroupId = renderingGroupId;
        const material = new StandardMaterial("emitterSphereMaterial", scene);
        material.emissiveColor = options.color;
        emitterMesh.material = material;
        for (const system of this.systems) {
            system.emitter = emitterMesh;
        }
        this._emitterNode = emitterMesh;
    }
    /**
     * Starts all particle systems of the set
     * @param emitter defines an optional mesh to use as emitter for the particle systems
     */
    start(emitter) {
        for (const system of this.systems) {
            if (emitter) {
                system.emitter = emitter;
            }
            system.start();
        }
    }
    /**
     * Release all associated resources
     */
    dispose() {
        for (const system of this.systems) {
            system.dispose();
        }
        this.systems.length = 0;
        if (this._emitterNode) {
            if (this._emitterNode.dispose) {
                this._emitterNode.dispose();
            }
            this._emitterNode = null;
        }
    }
    /**
     * Serialize the set into a JSON compatible object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns a JSON compatible representation of the set
     */
    serialize(serializeTexture = false) {
        const result = {};
        result.systems = [];
        for (const system of this.systems) {
            result.systems.push(system.serialize(serializeTexture));
        }
        if (this._emitterNode) {
            result.emitter = this._emitterCreationOptions;
        }
        return result;
    }
    /**
     * Parse a new ParticleSystemSet from a serialized source
     * @param data defines a JSON compatible representation of the set
     * @param scene defines the hosting scene
     * @param gpu defines if we want GPU particles or CPU particles
     * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
     * @returns a new ParticleSystemSet
     */
    static Parse(data, scene, gpu = false, capacity) {
        const result = new ParticleSystemSet();
        const rootUrl = this.BaseAssetsUrl + "/textures/";
        scene = scene || EngineStore.LastCreatedScene;
        for (const system of data.systems) {
            result.systems.push(gpu ? GPUParticleSystem.Parse(system, scene, rootUrl, true, capacity) : ParticleSystem.Parse(system, scene, rootUrl, true, capacity));
        }
        if (data.emitter) {
            const options = data.emitter.options;
            switch (data.emitter.kind) {
                case "Sphere":
                    result.setEmitterAsSphere({
                        diameter: options.diameter,
                        segments: options.segments,
                        color: Color3.FromArray(options.color),
                    }, data.emitter.renderingGroupId, scene);
                    break;
            }
        }
        return result;
    }
}
/**
 * Gets or sets base Assets URL
 */
ParticleSystemSet.BaseAssetsUrl = "https://assets.babylonjs.com/particles";
//# sourceMappingURL=particleSystemSet.js.map