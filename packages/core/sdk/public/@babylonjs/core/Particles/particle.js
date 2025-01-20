import { Vector2, Vector3, TmpVectors, Vector4 } from "../Maths/math.vector.js";
import { Color4 } from "../Maths/math.color.js";
import { Clamp } from "../Maths/math.scalar.functions.js";
/**
 * A particle represents one of the element emitted by a particle system.
 * This is mainly define by its coordinates, direction, velocity and age.
 */
export class Particle {
    /**
     * Creates a new instance Particle
     * @param particleSystem the particle system the particle belongs to
     */
    constructor(
    /**
     * The particle system the particle belongs to.
     */
    particleSystem) {
        this.particleSystem = particleSystem;
        /**
         * The world position of the particle in the scene.
         */
        this.position = Vector3.Zero();
        /**
         * The world direction of the particle in the scene.
         */
        this.direction = Vector3.Zero();
        /**
         * The color of the particle.
         */
        this.color = new Color4(0, 0, 0, 0);
        /**
         * The color change of the particle per step.
         */
        this.colorStep = new Color4(0, 0, 0, 0);
        /**
         * Defines how long will the life of the particle be.
         */
        this.lifeTime = 1.0;
        /**
         * The current age of the particle.
         */
        this.age = 0;
        /**
         * The current size of the particle.
         */
        this.size = 0;
        /**
         * The current scale of the particle.
         */
        this.scale = new Vector2(1, 1);
        /**
         * The current angle of the particle.
         */
        this.angle = 0;
        /**
         * Defines how fast is the angle changing.
         */
        this.angularSpeed = 0;
        /**
         * Defines the cell index used by the particle to be rendered from a sprite.
         */
        this.cellIndex = 0;
        /** @internal */
        this._attachedSubEmitters = null;
        /** @internal */
        this._currentColor1 = new Color4(0, 0, 0, 0);
        /** @internal */
        this._currentColor2 = new Color4(0, 0, 0, 0);
        /** @internal */
        this._currentSize1 = 0;
        /** @internal */
        this._currentSize2 = 0;
        /** @internal */
        this._currentAngularSpeed1 = 0;
        /** @internal */
        this._currentAngularSpeed2 = 0;
        /** @internal */
        this._currentVelocity1 = 0;
        /** @internal */
        this._currentVelocity2 = 0;
        /** @internal */
        this._currentLimitVelocity1 = 0;
        /** @internal */
        this._currentLimitVelocity2 = 0;
        /** @internal */
        this._currentDrag1 = 0;
        /** @internal */
        this._currentDrag2 = 0;
        this.id = Particle._Count++;
        if (!this.particleSystem.isAnimationSheetEnabled) {
            return;
        }
        this._updateCellInfoFromSystem();
    }
    _updateCellInfoFromSystem() {
        this.cellIndex = this.particleSystem.startSpriteCellID;
    }
    /**
     * Defines how the sprite cell index is updated for the particle
     */
    updateCellIndex() {
        let offsetAge = this.age;
        let changeSpeed = this.particleSystem.spriteCellChangeSpeed;
        if (this.particleSystem.spriteRandomStartCell) {
            if (this._randomCellOffset === undefined) {
                this._randomCellOffset = Math.random() * this.lifeTime;
            }
            if (changeSpeed === 0) {
                // Special case when speed = 0 meaning we want to stay on initial cell
                changeSpeed = 1;
                offsetAge = this._randomCellOffset;
            }
            else {
                offsetAge += this._randomCellOffset;
            }
        }
        const dist = this._initialEndSpriteCellID - this._initialStartSpriteCellID + 1;
        let ratio;
        if (this._initialSpriteCellLoop) {
            ratio = Clamp(((offsetAge * changeSpeed) % this.lifeTime) / this.lifeTime);
        }
        else {
            ratio = Clamp((offsetAge * changeSpeed) / this.lifeTime);
        }
        this.cellIndex = (this._initialStartSpriteCellID + ratio * dist) | 0;
    }
    /**
     * @internal
     */
    _inheritParticleInfoToSubEmitter(subEmitter) {
        if (subEmitter.particleSystem.emitter.position) {
            const emitterMesh = subEmitter.particleSystem.emitter;
            emitterMesh.position.copyFrom(this.position);
            if (subEmitter.inheritDirection) {
                const temp = TmpVectors.Vector3[0];
                this.direction.normalizeToRef(temp);
                emitterMesh.setDirection(temp, 0, Math.PI / 2);
            }
        }
        else {
            const emitterPosition = subEmitter.particleSystem.emitter;
            emitterPosition.copyFrom(this.position);
        }
        // Set inheritedVelocityOffset to be used when new particles are created
        this.direction.scaleToRef(subEmitter.inheritedVelocityAmount / 2, TmpVectors.Vector3[0]);
        subEmitter.particleSystem._inheritedVelocityOffset.copyFrom(TmpVectors.Vector3[0]);
    }
    /** @internal */
    _inheritParticleInfoToSubEmitters() {
        if (this._attachedSubEmitters && this._attachedSubEmitters.length > 0) {
            this._attachedSubEmitters.forEach((subEmitter) => {
                this._inheritParticleInfoToSubEmitter(subEmitter);
            });
        }
    }
    /** @internal */
    _reset() {
        this.age = 0;
        this.id = Particle._Count++;
        this._currentColorGradient = null;
        this._currentSizeGradient = null;
        this._currentAngularSpeedGradient = null;
        this._currentVelocityGradient = null;
        this._currentLimitVelocityGradient = null;
        this._currentDragGradient = null;
        this.cellIndex = this.particleSystem.startSpriteCellID;
        this._randomCellOffset = undefined;
    }
    /**
     * Copy the properties of particle to another one.
     * @param other the particle to copy the information to.
     */
    copyTo(other) {
        other.position.copyFrom(this.position);
        if (this._initialDirection) {
            if (other._initialDirection) {
                other._initialDirection.copyFrom(this._initialDirection);
            }
            else {
                other._initialDirection = this._initialDirection.clone();
            }
        }
        else {
            other._initialDirection = null;
        }
        other.direction.copyFrom(this.direction);
        if (this._localPosition) {
            if (other._localPosition) {
                other._localPosition.copyFrom(this._localPosition);
            }
            else {
                other._localPosition = this._localPosition.clone();
            }
        }
        other.color.copyFrom(this.color);
        other.colorStep.copyFrom(this.colorStep);
        other.lifeTime = this.lifeTime;
        other.age = this.age;
        other._randomCellOffset = this._randomCellOffset;
        other.size = this.size;
        other.scale.copyFrom(this.scale);
        other.angle = this.angle;
        other.angularSpeed = this.angularSpeed;
        other.particleSystem = this.particleSystem;
        other.cellIndex = this.cellIndex;
        other.id = this.id;
        other._attachedSubEmitters = this._attachedSubEmitters;
        if (this._currentColorGradient) {
            other._currentColorGradient = this._currentColorGradient;
            other._currentColor1.copyFrom(this._currentColor1);
            other._currentColor2.copyFrom(this._currentColor2);
        }
        if (this._currentSizeGradient) {
            other._currentSizeGradient = this._currentSizeGradient;
            other._currentSize1 = this._currentSize1;
            other._currentSize2 = this._currentSize2;
        }
        if (this._currentAngularSpeedGradient) {
            other._currentAngularSpeedGradient = this._currentAngularSpeedGradient;
            other._currentAngularSpeed1 = this._currentAngularSpeed1;
            other._currentAngularSpeed2 = this._currentAngularSpeed2;
        }
        if (this._currentVelocityGradient) {
            other._currentVelocityGradient = this._currentVelocityGradient;
            other._currentVelocity1 = this._currentVelocity1;
            other._currentVelocity2 = this._currentVelocity2;
        }
        if (this._currentLimitVelocityGradient) {
            other._currentLimitVelocityGradient = this._currentLimitVelocityGradient;
            other._currentLimitVelocity1 = this._currentLimitVelocity1;
            other._currentLimitVelocity2 = this._currentLimitVelocity2;
        }
        if (this._currentDragGradient) {
            other._currentDragGradient = this._currentDragGradient;
            other._currentDrag1 = this._currentDrag1;
            other._currentDrag2 = this._currentDrag2;
        }
        if (this.particleSystem.isAnimationSheetEnabled) {
            other._initialStartSpriteCellID = this._initialStartSpriteCellID;
            other._initialEndSpriteCellID = this._initialEndSpriteCellID;
            other._initialSpriteCellLoop = this._initialSpriteCellLoop;
        }
        if (this.particleSystem.useRampGradients) {
            if (other.remapData && this.remapData) {
                other.remapData.copyFrom(this.remapData);
            }
            else {
                other.remapData = new Vector4(0, 0, 0, 0);
            }
        }
        if (this._randomNoiseCoordinates1) {
            if (other._randomNoiseCoordinates1) {
                other._randomNoiseCoordinates1.copyFrom(this._randomNoiseCoordinates1);
                other._randomNoiseCoordinates2.copyFrom(this._randomNoiseCoordinates2);
            }
            else {
                other._randomNoiseCoordinates1 = this._randomNoiseCoordinates1.clone();
                other._randomNoiseCoordinates2 = this._randomNoiseCoordinates2.clone();
            }
        }
    }
}
Particle._Count = 0;
//# sourceMappingURL=particle.js.map