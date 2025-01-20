import { DeepCopier } from "../../Misc/deepCopier.js";
import { Vector3, TmpVectors } from "../../Maths/math.vector.js";
/**
 * Particle emitter emitting particles from a custom list of positions.
 */
export class CustomParticleEmitter {
    /**
     * Creates a new instance CustomParticleEmitter
     */
    constructor() {
        /**
         * Gets or sets the position generator that will create the initial position of each particle.
         * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
         */
        this.particlePositionGenerator = () => { };
        /**
         * Gets or sets the destination generator that will create the final destination of each particle.
         *  * Index will be provided when used with GPU particle. Particle will be provided when used with CPU particles
         */
        this.particleDestinationGenerator = () => { };
    }
    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    startDirectionFunction(worldMatrix, directionToUpdate, particle, isLocal) {
        const tmpVector = TmpVectors.Vector3[0];
        if (this.particleDestinationGenerator) {
            this.particleDestinationGenerator(-1, particle, tmpVector);
            // Get direction
            const diffVector = TmpVectors.Vector3[1];
            tmpVector.subtractToRef(particle.position, diffVector);
            diffVector.scaleToRef(1 / particle.lifeTime, tmpVector);
        }
        else {
            tmpVector.set(0, 0, 0);
        }
        if (isLocal) {
            directionToUpdate.copyFrom(tmpVector);
            return;
        }
        Vector3.TransformNormalToRef(tmpVector, worldMatrix, directionToUpdate);
    }
    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    startPositionFunction(worldMatrix, positionToUpdate, particle, isLocal) {
        const tmpVector = TmpVectors.Vector3[0];
        if (this.particlePositionGenerator) {
            this.particlePositionGenerator(-1, particle, tmpVector);
        }
        else {
            tmpVector.set(0, 0, 0);
        }
        if (isLocal) {
            positionToUpdate.copyFrom(tmpVector);
            return;
        }
        Vector3.TransformCoordinatesToRef(tmpVector, worldMatrix, positionToUpdate);
    }
    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    clone() {
        const newOne = new CustomParticleEmitter();
        DeepCopier.DeepCopy(this, newOne);
        return newOne;
    }
    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applyToShader(uboOrEffect) { }
    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    buildUniformLayout(ubo) { }
    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
     */
    getEffectDefines() {
        return "#define CUSTOMEMITTER";
    }
    /**
     * Returns the string "PointParticleEmitter"
     * @returns a string containing the class name
     */
    getClassName() {
        return "CustomParticleEmitter";
    }
    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.type = this.getClassName();
        serializationObject.particlePositionGenerator = this.particlePositionGenerator;
        serializationObject.particleDestinationGenerator = this.particleDestinationGenerator;
        return serializationObject;
    }
    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    parse(serializationObject) {
        if (serializationObject.particlePositionGenerator) {
            this.particlePositionGenerator = serializationObject.particlePositionGenerator;
        }
        if (serializationObject.particleDestinationGenerator) {
            this.particleDestinationGenerator = serializationObject.particleDestinationGenerator;
        }
    }
}
//# sourceMappingURL=customParticleEmitter.js.map