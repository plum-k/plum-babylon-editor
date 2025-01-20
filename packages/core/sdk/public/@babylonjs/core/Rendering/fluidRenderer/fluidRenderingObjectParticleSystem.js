
import { FluidRenderingObject } from "./fluidRenderingObject.js";
/**
 * Defines a rendering object based on a particle system
 */
export class FluidRenderingObjectParticleSystem extends FluidRenderingObject {
    /** Gets the particle system */
    get particleSystem() {
        return this._particleSystem;
    }
    /**
     * @returns the name of the class
     */
    getClassName() {
        return "FluidRenderingObjectParticleSystem";
    }
    /**
     * Gets or sets a boolean indicating that the diffuse texture should be generated based on the regular rendering of the particle system (default: true).
     * Sometimes, generating the diffuse texture this way may be sub-optimal. In that case, you can disable this property, in which case the particle system will be
     * rendered using a ALPHA_COMBINE mode instead of the one used by the particle system.
     */
    get useTrueRenderingForDiffuseTexture() {
        return this._useTrueRenderingForDiffuseTexture;
    }
    set useTrueRenderingForDiffuseTexture(use) {
        if (this._useTrueRenderingForDiffuseTexture === use) {
            return;
        }
        this._useTrueRenderingForDiffuseTexture = use;
        if (use) {
            this._particleSystem.blendMode = this._blendMode;
            this._particleSystem.onBeforeDrawParticlesObservable.remove(this._onBeforeDrawParticleObserver);
            this._onBeforeDrawParticleObserver = null;
        }
        else {
            this._particleSystem.blendMode = -1;
            this._onBeforeDrawParticleObserver = this._particleSystem.onBeforeDrawParticlesObservable.add(() => {
                this._engine.setAlphaMode(2);
            });
        }
    }
    /**
     * Gets the vertex buffers
     */
    get vertexBuffers() {
        return this._particleSystem.vertexBuffers;
    }
    /**
     * Gets the index buffer (or null if the object is using instancing)
     */
    get indexBuffer() {
        return this._particleSystem.indexBuffer;
    }
    /**
     * Creates a new instance of the class
     * @param scene The scene the particle system is part of
     * @param ps The particle system
     * @param shaderLanguage The shader language to use
     */
    constructor(scene, ps, shaderLanguage) {
        super(scene, shaderLanguage);
        this._useTrueRenderingForDiffuseTexture = true;
        this._particleSystem = ps;
        this._originalRender = ps.render.bind(ps);
        this._blendMode = ps.blendMode;
        this._onBeforeDrawParticleObserver = null;
        this._updateInAnimate = this._particleSystem.updateInAnimate;
        this._particleSystem.updateInAnimate = true;
        this._particleSystem.render = () => 0;
        this.particleSize = (ps.minSize + ps.maxSize) / 2;
        this.useTrueRenderingForDiffuseTexture = false;
    }
    /**
     * Indicates if the object is ready to be rendered
     * @returns True if everything is ready for the object to be rendered, otherwise false
     */
    isReady() {
        return super.isReady() && this._particleSystem.isReady();
    }
    /**
     * Gets the number of particles in this particle system
     * @returns The number of particles
     */
    get numParticles() {
        return this._particleSystem.getActiveCount();
    }
    /**
     * Render the diffuse texture for this object
     */
    renderDiffuseTexture() {
        this._originalRender();
    }
    /**
     * Releases the ressources used by the class
     */
    dispose() {
        super.dispose();
        this._particleSystem.onBeforeDrawParticlesObservable.remove(this._onBeforeDrawParticleObserver);
        this._onBeforeDrawParticleObserver = null;
        this._particleSystem.render = this._originalRender;
        this._particleSystem.blendMode = this._blendMode;
        this._particleSystem.updateInAnimate = this._updateInAnimate;
    }
}
//# sourceMappingURL=fluidRenderingObjectParticleSystem.js.map