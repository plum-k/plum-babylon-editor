import { DeepCopier } from "../../Misc/deepCopier.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { RandomRange } from "../../Maths/math.scalar.functions.js";
/**
 * Particle emitter emitting particles from the inside of a hemisphere.
 * It emits the particles alongside the hemisphere radius. The emission direction might be randomized.
 */
export class HemisphericParticleEmitter {
    /**
     * Creates a new instance HemisphericParticleEmitter
     * @param radius the radius of the emission hemisphere (1 by default)
     * @param radiusRange the range of the emission hemisphere [0-1] 0 Surface only, 1 Entire Radius (1 by default)
     * @param directionRandomizer defines how much to randomize the particle direction [0-1]
     */
    constructor(
    /**
     * [1] The radius of the emission hemisphere.
     */
    radius = 1, 
    /**
     * [1] The range of emission [0-1] 0 Surface only, 1 Entire Radius.
     */
    radiusRange = 1, 
    /**
     * [0] How much to randomize the particle direction [0-1].
     */
    directionRandomizer = 0) {
        this.radius = radius;
        this.radiusRange = radiusRange;
        this.directionRandomizer = directionRandomizer;
    }
    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     * @param particle is the particle we are computed the direction for
     * @param isLocal defines if the direction should be set in local space
     */
    startDirectionFunction(worldMatrix, directionToUpdate, particle, isLocal) {
        const direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
        const randX = RandomRange(0, this.directionRandomizer);
        const randY = RandomRange(0, this.directionRandomizer);
        const randZ = RandomRange(0, this.directionRandomizer);
        direction.x += randX;
        direction.y += randY;
        direction.z += randZ;
        direction.normalize();
        if (isLocal) {
            directionToUpdate.copyFrom(direction);
            return;
        }
        Vector3.TransformNormalFromFloatsToRef(direction.x, direction.y, direction.z, worldMatrix, directionToUpdate);
    }
    /**
     * Called by the particle System when the position is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param positionToUpdate is the position vector to update with the result
     * @param particle is the particle we are computed the position for
     * @param isLocal defines if the position should be set in local space
     */
    startPositionFunction(worldMatrix, positionToUpdate, particle, isLocal) {
        const randRadius = this.radius - RandomRange(0, this.radius * this.radiusRange);
        const v = RandomRange(0, 1.0);
        const phi = RandomRange(0, 2 * Math.PI);
        const theta = Math.acos(2 * v - 1);
        const randX = randRadius * Math.cos(phi) * Math.sin(theta);
        const randY = randRadius * Math.cos(theta);
        const randZ = randRadius * Math.sin(phi) * Math.sin(theta);
        if (isLocal) {
            positionToUpdate.copyFromFloats(randX, Math.abs(randY), randZ);
            return;
        }
        Vector3.TransformCoordinatesFromFloatsToRef(randX, Math.abs(randY), randZ, worldMatrix, positionToUpdate);
    }
    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    clone() {
        const newOne = new HemisphericParticleEmitter(this.radius, this.directionRandomizer);
        DeepCopier.DeepCopy(this, newOne);
        return newOne;
    }
    /**
     * Called by the GPUParticleSystem to setup the update shader
     * @param uboOrEffect defines the update shader
     */
    applyToShader(uboOrEffect) {
        uboOrEffect.setFloat("radius", this.radius);
        uboOrEffect.setFloat("radiusRange", this.radiusRange);
        uboOrEffect.setFloat("directionRandomizer", this.directionRandomizer);
    }
    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    buildUniformLayout(ubo) {
        ubo.addUniform("radius", 1);
        ubo.addUniform("radiusRange", 1);
        ubo.addUniform("directionRandomizer", 1);
    }
    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
     */
    getEffectDefines() {
        return "#define HEMISPHERICEMITTER";
    }
    /**
     * Returns the string "HemisphericParticleEmitter"
     * @returns a string containing the class name
     */
    getClassName() {
        return "HemisphericParticleEmitter";
    }
    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    serialize() {
        const serializationObject = {};
        serializationObject.type = this.getClassName();
        serializationObject.radius = this.radius;
        serializationObject.radiusRange = this.radiusRange;
        serializationObject.directionRandomizer = this.directionRandomizer;
        return serializationObject;
    }
    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    parse(serializationObject) {
        this.radius = serializationObject.radius;
        this.radiusRange = serializationObject.radiusRange;
        this.directionRandomizer = serializationObject.directionRandomizer;
    }
}
//# sourceMappingURL=hemisphericParticleEmitter.js.map