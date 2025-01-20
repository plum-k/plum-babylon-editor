import { Vector3 } from "../../Maths/math.vector.js";
import { RandomRange } from "../../Maths/math.scalar.functions.js";
import { DeepCopier } from "../../Misc/deepCopier.js";
/**
 * Particle emitter emitting particles from the inside of a sphere.
 * It emits the particles alongside the sphere radius. The emission direction might be randomized.
 */
export class SphereParticleEmitter {
    /**
     * Creates a new instance SphereParticleEmitter
     * @param radius the radius of the emission sphere (1 by default)
     * @param radiusRange the range of the emission sphere [0-1] 0 Surface only, 1 Entire Radius (1 by default)
     * @param directionRandomizer defines how much to randomize the particle direction [0-1]
     */
    constructor(
    /**
     * [1] The radius of the emission sphere.
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
            positionToUpdate.copyFromFloats(randX, randY, randZ);
            return;
        }
        Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
    }
    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    clone() {
        const newOne = new SphereParticleEmitter(this.radius, this.directionRandomizer);
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
        return "#define SPHEREEMITTER";
    }
    /**
     * Returns the string "SphereParticleEmitter"
     * @returns a string containing the class name
     */
    getClassName() {
        return "SphereParticleEmitter";
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
/**
 * Particle emitter emitting particles from the inside of a sphere.
 * It emits the particles randomly between two vectors.
 */
export class SphereDirectedParticleEmitter extends SphereParticleEmitter {
    /**
     * Creates a new instance SphereDirectedParticleEmitter
     * @param radius the radius of the emission sphere (1 by default)
     * @param direction1 the min limit of the emission direction (up vector by default)
     * @param direction2 the max limit of the emission direction (up vector by default)
     */
    constructor(radius = 1, 
    /**
     * [Up vector] The min limit of the emission direction.
     */
    direction1 = new Vector3(0, 1, 0), 
    /**
     * [Up vector] The max limit of the emission direction.
     */
    direction2 = new Vector3(0, 1, 0)) {
        super(radius);
        this.direction1 = direction1;
        this.direction2 = direction2;
    }
    /**
     * Called by the particle System when the direction is computed for the created particle.
     * @param worldMatrix is the world matrix of the particle system
     * @param directionToUpdate is the direction vector to update with the result
     */
    startDirectionFunction(worldMatrix, directionToUpdate) {
        const randX = RandomRange(this.direction1.x, this.direction2.x);
        const randY = RandomRange(this.direction1.y, this.direction2.y);
        const randZ = RandomRange(this.direction1.z, this.direction2.z);
        Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, worldMatrix, directionToUpdate);
    }
    /**
     * Clones the current emitter and returns a copy of it
     * @returns the new emitter
     */
    clone() {
        const newOne = new SphereDirectedParticleEmitter(this.radius, this.direction1, this.direction2);
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
        uboOrEffect.setVector3("direction1", this.direction1);
        uboOrEffect.setVector3("direction2", this.direction2);
    }
    /**
     * Creates the structure of the ubo for this particle emitter
     * @param ubo ubo to create the structure for
     */
    buildUniformLayout(ubo) {
        ubo.addUniform("radius", 1);
        ubo.addUniform("radiusRange", 1);
        ubo.addUniform("direction1", 3);
        ubo.addUniform("direction2", 3);
    }
    /**
     * Returns a string to use to update the GPU particles update shader
     * @returns a string containing the defines string
     */
    getEffectDefines() {
        return "#define SPHEREEMITTER\n#define DIRECTEDSPHEREEMITTER";
    }
    /**
     * Returns the string "SphereDirectedParticleEmitter"
     * @returns a string containing the class name
     */
    getClassName() {
        return "SphereDirectedParticleEmitter";
    }
    /**
     * Serializes the particle system to a JSON object.
     * @returns the JSON object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.direction1 = this.direction1.asArray();
        serializationObject.direction2 = this.direction2.asArray();
        return serializationObject;
    }
    /**
     * Parse properties from a JSON object
     * @param serializationObject defines the JSON object
     */
    parse(serializationObject) {
        super.parse(serializationObject);
        this.direction1.copyFrom(serializationObject.direction1);
        this.direction2.copyFrom(serializationObject.direction2);
    }
}
//# sourceMappingURL=sphereParticleEmitter.js.map