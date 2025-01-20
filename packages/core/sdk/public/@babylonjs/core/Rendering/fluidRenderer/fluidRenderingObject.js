
import { EffectWrapper } from "../../Materials/effectRenderer.js";
import { Observable } from "../../Misc/observable.js";
/**
 * Defines the base object used for fluid rendering.
 * It is based on a list of vertices (particles)
 */
export class FluidRenderingObject {
    /** Gets or sets the size of the particle */
    get particleSize() {
        return this._particleSize;
    }
    set particleSize(size) {
        if (size === this._particleSize) {
            return;
        }
        this._particleSize = size;
        this.onParticleSizeChanged.notifyObservers(this);
    }
    /** Indicates if the object uses instancing or not */
    get useInstancing() {
        return !this.indexBuffer;
    }
    /** Indicates if velocity of particles should be used when rendering the object. The vertex buffer set must contain a "velocity" buffer for this to work! */
    get useVelocity() {
        return this._useVelocity;
    }
    set useVelocity(use) {
        if (this._useVelocity === use || !this._hasVelocity()) {
            return;
        }
        this._useVelocity = use;
        this._effectsAreDirty = true;
    }
    _hasVelocity() {
        return !!this.vertexBuffers?.velocity;
    }
    /**
     * Gets the index buffer (or null if the object is using instancing)
     */
    get indexBuffer() {
        return null;
    }
    /**
     * @returns the name of the class
     */
    getClassName() {
        return "FluidRenderingObject";
    }
    /**
     * Gets the shader language used in this object
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Instantiates a fluid rendering object
     * @param scene The scene the object is part of
     * @param shaderLanguage The shader language to use
     */
    constructor(scene, shaderLanguage) {
        /** Defines the priority of the object. Objects will be rendered in ascending order of priority */
        this.priority = 0;
        this._particleSize = 0.1;
        /** Observable triggered when the size of the particle is changed */
        this.onParticleSizeChanged = new Observable();
        /** Defines the alpha value of a particle */
        this.particleThicknessAlpha = 0.05;
        this._useVelocity = false;
        /** Shader language used by the object */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._scene = scene;
        this._engine = scene.getEngine();
        this._effectsAreDirty = true;
        this._depthEffectWrapper = null;
        this._thicknessEffectWrapper = null;
        this._shaderLanguage = shaderLanguage ?? (this._engine.isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */);
    }
    _createEffects() {
        const uniformNames = ["view", "projection", "particleRadius", "size"];
        const attributeNames = ["position", "offset"];
        const defines = [];
        this._effectsAreDirty = false;
        if (this.useVelocity) {
            attributeNames.push("velocity");
            defines.push("#define FLUIDRENDERING_VELOCITY");
        }
        if (this._scene.useRightHandedSystem) {
            defines.push("#define FLUIDRENDERING_RHS");
        }
        this._depthEffectWrapper = new EffectWrapper({
            engine: this._engine,
            useShaderStore: true,
            vertexShader: "fluidRenderingParticleDepth",
            fragmentShader: "fluidRenderingParticleDepth",
            attributeNames,
            uniformNames,
            samplerNames: [],
            defines,
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await Promise.all([import("../../ShadersWGSL/fluidRenderingParticleDepth.vertex.js"), import("../../ShadersWGSL/fluidRenderingParticleDepth.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/fluidRenderingParticleDepth.vertex.js"), import("../../Shaders/fluidRenderingParticleDepth.fragment.js")]);
                }
            },
        });
        uniformNames.push("particleAlpha");
        this._thicknessEffectWrapper = new EffectWrapper({
            engine: this._engine,
            useShaderStore: true,
            vertexShader: "fluidRenderingParticleThickness",
            fragmentShader: "fluidRenderingParticleThickness",
            attributeNames: ["position", "offset"],
            uniformNames,
            samplerNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await Promise.all([import("../../ShadersWGSL/fluidRenderingParticleThickness.vertex.js"), import("../../ShadersWGSL/fluidRenderingParticleThickness.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/fluidRenderingParticleThickness.vertex.js"), import("../../Shaders/fluidRenderingParticleThickness.fragment.js")]);
                }
            },
        });
    }
    /**
     * Indicates if the object is ready to be rendered
     * @returns True if everything is ready for the object to be rendered, otherwise false
     */
    isReady() {
        if (this._effectsAreDirty) {
            this._createEffects();
        }
        if (!this._depthEffectWrapper || !this._thicknessEffectWrapper) {
            return false;
        }
        const depthEffect = this._depthEffectWrapper.drawWrapper.effect;
        const thicknessEffect = this._thicknessEffectWrapper.drawWrapper.effect;
        return depthEffect.isReady() && thicknessEffect.isReady();
    }
    /**
     * Render the depth texture for this object
     */
    renderDepthTexture() {
        const numParticles = this.numParticles;
        if (!this._depthEffectWrapper || numParticles === 0) {
            return;
        }
        const depthDrawWrapper = this._depthEffectWrapper.drawWrapper;
        const depthEffect = depthDrawWrapper.effect;
        this._engine.enableEffect(depthDrawWrapper);
        this._engine.bindBuffers(this.vertexBuffers, this.indexBuffer, depthEffect);
        depthEffect.setMatrix("view", this._scene.getViewMatrix());
        depthEffect.setMatrix("projection", this._scene.getProjectionMatrix());
        depthEffect.setFloat2("size", this._particleSize, this._particleSize);
        depthEffect.setFloat("particleRadius", this._particleSize / 2);
        if (this.useInstancing) {
            this._engine.drawArraysType(7, 0, 4, numParticles);
        }
        else {
            this._engine.drawElementsType(0, 0, numParticles);
        }
    }
    /**
     * Render the thickness texture for this object
     */
    renderThicknessTexture() {
        const numParticles = this.numParticles;
        if (!this._thicknessEffectWrapper || numParticles === 0) {
            return;
        }
        const thicknessDrawWrapper = this._thicknessEffectWrapper.drawWrapper;
        const thicknessEffect = thicknessDrawWrapper.effect;
        this._engine.setAlphaMode(6);
        this._engine.setDepthWrite(false);
        this._engine.enableEffect(thicknessDrawWrapper);
        this._engine.bindBuffers(this.vertexBuffers, this.indexBuffer, thicknessEffect);
        thicknessEffect.setMatrix("view", this._scene.getViewMatrix());
        thicknessEffect.setMatrix("projection", this._scene.getProjectionMatrix());
        thicknessEffect.setFloat("particleAlpha", this.particleThicknessAlpha);
        thicknessEffect.setFloat2("size", this._particleSize, this._particleSize);
        if (this.useInstancing) {
            this._engine.drawArraysType(7, 0, 4, numParticles);
        }
        else {
            this._engine.drawElementsType(0, 0, numParticles);
        }
        this._engine.setDepthWrite(true);
        this._engine.setAlphaMode(0);
    }
    /**
     * Render the diffuse texture for this object
     */
    renderDiffuseTexture() {
        // do nothing by default
    }
    /**
     * Releases the ressources used by the class
     */
    dispose() {
        this._depthEffectWrapper?.dispose(false);
        this._thicknessEffectWrapper?.dispose(false);
        this.onParticleSizeChanged.clear();
    }
}
//# sourceMappingURL=fluidRenderingObject.js.map