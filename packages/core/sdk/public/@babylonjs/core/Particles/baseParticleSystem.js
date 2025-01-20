import { Vector2, Vector3 } from "../Maths/math.vector.js";
import { ImageProcessingConfigurationDefines } from "../Materials/imageProcessingConfiguration.defines.js";

import { Color4 } from "../Maths/math.color.js";
import "../Engines/Extensions/engine.dynamicBuffer.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * This represents the base class for particle system in Babylon.
 * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
 * Particles can take different shapes while emitted like box, sphere, cone or you can write your custom function.
 * @example https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro
 */
export class BaseParticleSystem {
    /**
     * Gets or sets a texture used to add random noise to particle positions
     */
    get noiseTexture() {
        return this._noiseTexture;
    }
    set noiseTexture(value) {
        if (this._noiseTexture === value) {
            return;
        }
        this._noiseTexture = value;
        this._reset();
    }
    /**
     * Gets or sets whether an animation sprite sheet is enabled or not on the particle system
     */
    get isAnimationSheetEnabled() {
        return this._isAnimationSheetEnabled;
    }
    set isAnimationSheetEnabled(value) {
        if (this._isAnimationSheetEnabled == value) {
            return;
        }
        this._isAnimationSheetEnabled = value;
        this._reset();
    }
    /**
     * Gets or sets a boolean enabling the use of logarithmic depth buffers, which is good for wide depth buffers.
     */
    get useLogarithmicDepth() {
        return this._useLogarithmicDepth;
    }
    set useLogarithmicDepth(value) {
        this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
    }
    /**
     * Get hosting scene
     * @returns the scene
     */
    getScene() {
        return this._scene;
    }
    _hasTargetStopDurationDependantGradient() {
        return ((this._startSizeGradients && this._startSizeGradients.length > 0) ||
            (this._emitRateGradients && this._emitRateGradients.length > 0) ||
            (this._lifeTimeGradients && this._lifeTimeGradients.length > 0));
    }
    /**
     * Gets the current list of drag gradients.
     * You must use addDragGradient and removeDragGradient to update this list
     * @returns the list of drag gradients
     */
    getDragGradients() {
        return this._dragGradients;
    }
    /**
     * Gets the current list of limit velocity gradients.
     * You must use addLimitVelocityGradient and removeLimitVelocityGradient to update this list
     * @returns the list of limit velocity gradients
     */
    getLimitVelocityGradients() {
        return this._limitVelocityGradients;
    }
    /**
     * Gets the current list of color gradients.
     * You must use addColorGradient and removeColorGradient to update this list
     * @returns the list of color gradients
     */
    getColorGradients() {
        return this._colorGradients;
    }
    /**
     * Gets the current list of size gradients.
     * You must use addSizeGradient and removeSizeGradient to update this list
     * @returns the list of size gradients
     */
    getSizeGradients() {
        return this._sizeGradients;
    }
    /**
     * Gets the current list of color remap gradients.
     * You must use addColorRemapGradient and removeColorRemapGradient to update this list
     * @returns the list of color remap gradients
     */
    getColorRemapGradients() {
        return this._colorRemapGradients;
    }
    /**
     * Gets the current list of alpha remap gradients.
     * You must use addAlphaRemapGradient and removeAlphaRemapGradient to update this list
     * @returns the list of alpha remap gradients
     */
    getAlphaRemapGradients() {
        return this._alphaRemapGradients;
    }
    /**
     * Gets the current list of life time gradients.
     * You must use addLifeTimeGradient and removeLifeTimeGradient to update this list
     * @returns the list of life time gradients
     */
    getLifeTimeGradients() {
        return this._lifeTimeGradients;
    }
    /**
     * Gets the current list of angular speed gradients.
     * You must use addAngularSpeedGradient and removeAngularSpeedGradient to update this list
     * @returns the list of angular speed gradients
     */
    getAngularSpeedGradients() {
        return this._angularSpeedGradients;
    }
    /**
     * Gets the current list of velocity gradients.
     * You must use addVelocityGradient and removeVelocityGradient to update this list
     * @returns the list of velocity gradients
     */
    getVelocityGradients() {
        return this._velocityGradients;
    }
    /**
     * Gets the current list of start size gradients.
     * You must use addStartSizeGradient and removeStartSizeGradient to update this list
     * @returns the list of start size gradients
     */
    getStartSizeGradients() {
        return this._startSizeGradients;
    }
    /**
     * Gets the current list of emit rate gradients.
     * You must use addEmitRateGradient and removeEmitRateGradient to update this list
     * @returns the list of emit rate gradients
     */
    getEmitRateGradients() {
        return this._emitRateGradients;
    }
    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    get direction1() {
        if (this.particleEmitterType.direction1) {
            return this.particleEmitterType.direction1;
        }
        return Vector3.Zero();
    }
    set direction1(value) {
        if (this.particleEmitterType.direction1) {
            this.particleEmitterType.direction1 = value;
        }
    }
    /**
     * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    get direction2() {
        if (this.particleEmitterType.direction2) {
            return this.particleEmitterType.direction2;
        }
        return Vector3.Zero();
    }
    set direction2(value) {
        if (this.particleEmitterType.direction2) {
            this.particleEmitterType.direction2 = value;
        }
    }
    /**
     * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    get minEmitBox() {
        if (this.particleEmitterType.minEmitBox) {
            return this.particleEmitterType.minEmitBox;
        }
        return Vector3.Zero();
    }
    set minEmitBox(value) {
        if (this.particleEmitterType.minEmitBox) {
            this.particleEmitterType.minEmitBox = value;
        }
    }
    /**
     * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
     * This only works when particleEmitterTyps is a BoxParticleEmitter
     */
    get maxEmitBox() {
        if (this.particleEmitterType.maxEmitBox) {
            return this.particleEmitterType.maxEmitBox;
        }
        return Vector3.Zero();
    }
    set maxEmitBox(value) {
        if (this.particleEmitterType.maxEmitBox) {
            this.particleEmitterType.maxEmitBox = value;
        }
    }
    /**
     * Gets or sets the billboard mode to use when isBillboardBased = true.
     * Value can be: ParticleSystem.BILLBOARDMODE_ALL, ParticleSystem.BILLBOARDMODE_Y, ParticleSystem.BILLBOARDMODE_STRETCHED
     */
    get billboardMode() {
        return this._billboardMode;
    }
    set billboardMode(value) {
        if (this._billboardMode === value) {
            return;
        }
        this._billboardMode = value;
        this._reset();
    }
    /**
     * Gets or sets a boolean indicating if the particles must be rendered as billboard or aligned with the direction
     */
    get isBillboardBased() {
        return this._isBillboardBased;
    }
    set isBillboardBased(value) {
        if (this._isBillboardBased === value) {
            return;
        }
        this._isBillboardBased = value;
        this._reset();
    }
    /**
     * Gets the image processing configuration used either in this material.
     */
    get imageProcessingConfiguration() {
        return this._imageProcessingConfiguration;
    }
    /**
     * Sets the Default image processing configuration used either in the this material.
     *
     * If sets to null, the scene one is in use.
     */
    set imageProcessingConfiguration(value) {
        this._attachImageProcessingConfiguration(value);
    }
    /**
     * Attaches a new image processing configuration to the Standard Material.
     * @param configuration
     */
    _attachImageProcessingConfiguration(configuration) {
        if (configuration === this._imageProcessingConfiguration) {
            return;
        }
        // Pick the scene configuration if needed.
        if (!configuration && this._scene) {
            this._imageProcessingConfiguration = this._scene.imageProcessingConfiguration;
        }
        else {
            this._imageProcessingConfiguration = configuration;
        }
    }
    /** @internal */
    _reset() { }
    /**
     * @internal
     */
    _removeGradientAndTexture(gradient, gradients, texture) {
        if (!gradients) {
            return this;
        }
        let index = 0;
        for (const valueGradient of gradients) {
            if (valueGradient.gradient === gradient) {
                gradients.splice(index, 1);
                break;
            }
            index++;
        }
        if (texture) {
            texture.dispose();
        }
        return this;
    }
    /**
     * Instantiates a particle system.
     * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
     * @param name The name of the particle system
     */
    constructor(name) {
        /**
         * List of animations used by the particle system.
         */
        this.animations = [];
        /**
         * The rendering group used by the Particle system to chose when to render.
         */
        this.renderingGroupId = 0;
        /**
         * The emitter represents the Mesh or position we are attaching the particle system to.
         */
        this.emitter = Vector3.Zero();
        /**
         * The maximum number of particles to emit per frame
         */
        this.emitRate = 10;
        /**
         * If you want to launch only a few particles at once, that can be done, as well.
         */
        this.manualEmitCount = -1;
        /**
         * The overall motion speed (0.01 is default update speed, faster updates = faster animation)
         */
        this.updateSpeed = 0.01;
        /**
         * The amount of time the particle system is running (depends of the overall update speed).
         */
        this.targetStopDuration = 0;
        /**
         * Specifies whether the particle system will be disposed once it reaches the end of the animation.
         */
        this.disposeOnStop = false;
        /**
         * Minimum power of emitting particles.
         */
        this.minEmitPower = 1;
        /**
         * Maximum power of emitting particles.
         */
        this.maxEmitPower = 1;
        /**
         * Minimum life time of emitting particles.
         */
        this.minLifeTime = 1;
        /**
         * Maximum life time of emitting particles.
         */
        this.maxLifeTime = 1;
        /**
         * Minimum Size of emitting particles.
         */
        this.minSize = 1;
        /**
         * Maximum Size of emitting particles.
         */
        this.maxSize = 1;
        /**
         * Minimum scale of emitting particles on X axis.
         */
        this.minScaleX = 1;
        /**
         * Maximum scale of emitting particles on X axis.
         */
        this.maxScaleX = 1;
        /**
         * Minimum scale of emitting particles on Y axis.
         */
        this.minScaleY = 1;
        /**
         * Maximum scale of emitting particles on Y axis.
         */
        this.maxScaleY = 1;
        /**
         * Gets or sets the minimal initial rotation in radians.
         */
        this.minInitialRotation = 0;
        /**
         * Gets or sets the maximal initial rotation in radians.
         */
        this.maxInitialRotation = 0;
        /**
         * Minimum angular speed of emitting particles (Z-axis rotation for each particle).
         */
        this.minAngularSpeed = 0;
        /**
         * Maximum angular speed of emitting particles (Z-axis rotation for each particle).
         */
        this.maxAngularSpeed = 0;
        /**
         * The layer mask we are rendering the particles through.
         */
        this.layerMask = 0x0fffffff;
        /**
         * This can help using your own shader to render the particle system.
         * The according effect will be created
         */
        this.customShader = null;
        /**
         * By default particle system starts as soon as they are created. This prevents the
         * automatic start to happen and let you decide when to start emitting particles.
         */
        this.preventAutoStart = false;
        /**
         * Gets or sets a boolean indicating that this particle system will allow fog to be rendered on it (false by default)
         */
        this.applyFog = false;
        /** @internal */
        this._wasDispatched = false;
        this._rootUrl = "";
        /** Gets or sets the strength to apply to the noise value (default is (10, 10, 10)) */
        this.noiseStrength = new Vector3(10, 10, 10);
        /**
         * Callback triggered when the particle animation is ending.
         */
        this.onAnimationEnd = null;
        /**
         * Blend mode use to render the particle, it can be either ParticleSystem.BLENDMODE_ONEONE or ParticleSystem.BLENDMODE_STANDARD.
         */
        this.blendMode = BaseParticleSystem.BLENDMODE_ONEONE;
        /**
         * Forces the particle to write their depth information to the depth buffer. This can help preventing other draw calls
         * to override the particles.
         */
        this.forceDepthWrite = false;
        /** Gets or sets a value indicating how many cycles (or frames) must be executed before first rendering (this value has to be set before starting the system). Default is 0 */
        this.preWarmCycles = 0;
        /** Gets or sets a value indicating the time step multiplier to use in pre-warm mode (default is 1) */
        this.preWarmStepOffset = 1;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) defines the speed of the sprite loop (default is 1 meaning the animation will play once during the entire particle lifetime)
         */
        this.spriteCellChangeSpeed = 1;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) defines the first sprite cell to display
         */
        this.startSpriteCellID = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled) defines the last sprite cell to display
         */
        this.endSpriteCellID = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell width to use
         */
        this.spriteCellWidth = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines the sprite cell height to use
         */
        this.spriteCellHeight = 0;
        /**
         * If using a spritesheet (isAnimationSheetEnabled), defines wether the sprite animation is looping
         */
        this.spriteCellLoop = true;
        /**
         * This allows the system to random pick the start cell ID between startSpriteCellID and endSpriteCellID
         */
        this.spriteRandomStartCell = false;
        /** Gets or sets a Vector2 used to move the pivot (by default (0,0)) */
        this.translationPivot = new Vector2(0, 0);
        /**
         * Gets or sets a boolean indicating that hosted animations (in the system.animations array) must be started when system.start() is called
         */
        this.beginAnimationOnStart = false;
        /**
         * Gets or sets the frame to start the animation from when beginAnimationOnStart is true
         */
        this.beginAnimationFrom = 0;
        /**
         * Gets or sets the frame to end the animation on when beginAnimationOnStart is true
         */
        this.beginAnimationTo = 60;
        /**
         * Gets or sets a boolean indicating if animations must loop when beginAnimationOnStart is true
         */
        this.beginAnimationLoop = false;
        /**
         * Gets or sets a world offset applied to all particles
         */
        this.worldOffset = new Vector3(0, 0, 0);
        this._useLogarithmicDepth = false;
        /**
         * You can use gravity if you want to give an orientation to your particles.
         */
        this.gravity = Vector3.Zero();
        this._colorGradients = null;
        this._sizeGradients = null;
        this._lifeTimeGradients = null;
        this._angularSpeedGradients = null;
        this._velocityGradients = null;
        this._limitVelocityGradients = null;
        this._dragGradients = null;
        this._emitRateGradients = null;
        this._startSizeGradients = null;
        this._rampGradients = null;
        this._colorRemapGradients = null;
        this._alphaRemapGradients = null;
        /**
         * Defines the delay in milliseconds before starting the system (0 by default)
         */
        this.startDelay = 0;
        /** Gets or sets a value indicating the damping to apply if the limit velocity factor is reached */
        this.limitVelocityDamping = 0.4;
        /**
         * Random color of each particle after it has been emitted, between color1 and color2 vectors
         */
        this.color1 = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * Random color of each particle after it has been emitted, between color1 and color2 vectors
         */
        this.color2 = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * Color the particle will have at the end of its lifetime
         */
        this.colorDead = new Color4(0, 0, 0, 1.0);
        /**
         * An optional mask to filter some colors out of the texture, or filter a part of the alpha channel
         */
        this.textureMask = new Color4(1.0, 1.0, 1.0, 1.0);
        /** @internal */
        this._isSubEmitter = false;
        /** @internal */
        this._billboardMode = 7;
        /** @internal */
        this._isBillboardBased = true;
        /**
         * Local cache of defines for image processing.
         */
        this._imageProcessingConfigurationDefines = new ImageProcessingConfigurationDefines();
        this.id = name;
        this.name = name;
    }
    /**
     * Creates a Point Emitter for the particle system (emits directly from the emitter position)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     */
    createPointEmitter(direction1, direction2) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
     * @param radius The radius of the hemisphere to emit from
     * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     */
    createHemisphericEmitter(radius = 1, radiusRange = 1) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
     * @param radius The radius of the sphere to emit from
     * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
     */
    createSphereEmitter(radius = 1, radiusRange = 1) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
     * @param radius The radius of the sphere to emit from
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
     */
    createDirectedSphereEmitter(radius = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Cylinder Emitter for the particle system (emits from the cylinder to the particle position)
     * @param radius The radius of the emission cylinder
     * @param height The height of the emission cylinder
     * @param radiusRange The range of emission [0-1] 0 Surface only, 1 Entire Radius
     * @param directionRandomizer How much to randomize the particle direction [0-1]
     */
    createCylinderEmitter(radius = 1, height = 1, radiusRange = 1, directionRandomizer = 0) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Directed Cylinder Emitter for the particle system (emits between direction1 and direction2)
     * @param radius The radius of the cylinder to emit from
     * @param height The height of the emission cylinder
     * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the cylinder
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the cylinder
     */
    createDirectedCylinderEmitter(radius = 1, height = 1, radiusRange = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
     * @param radius The radius of the cone to emit from
     * @param angle The base angle of the cone
     */
    createConeEmitter(radius = 1, angle = Math.PI / 4) {
        throw new Error("Method not implemented.");
    }
    createDirectedConeEmitter(radius = 1, angle = Math.PI / 4, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates a Box Emitter for the particle system. (emits between direction1 and direction2 from withing the box defined by minEmitBox and maxEmitBox)
     * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
     * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
     * @param minEmitBox Particles are emitted from the box between minEmitBox and maxEmitBox
     * @param maxEmitBox  Particles are emitted from the box between minEmitBox and maxEmitBox
     */
    createBoxEmitter(direction1, direction2, minEmitBox, maxEmitBox) {
        throw new Error("Method not implemented.");
    }
}
/**
 * Source color is added to the destination color without alpha affecting the result
 */
BaseParticleSystem.BLENDMODE_ONEONE = 0;
/**
 * Blend current color and particle color using particle’s alpha
 */
BaseParticleSystem.BLENDMODE_STANDARD = 1;
/**
 * Add current color and particle color multiplied by particle’s alpha
 */
BaseParticleSystem.BLENDMODE_ADD = 2;
/**
 * Multiply current color with particle color
 */
BaseParticleSystem.BLENDMODE_MULTIPLY = 3;
/**
 * Multiply current color with particle color then add current color and particle color multiplied by particle’s alpha
 */
BaseParticleSystem.BLENDMODE_MULTIPLYADD = 4;
// Register Class Name
RegisterClass("BABYLON.BaseParticleSystem", BaseParticleSystem);
//# sourceMappingURL=baseParticleSystem.js.map