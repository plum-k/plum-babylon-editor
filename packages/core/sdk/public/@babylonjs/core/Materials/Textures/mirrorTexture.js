import { Matrix, Vector3, Vector2 } from "../../Maths/math.vector.js";
import { Texture } from "../../Materials/Textures/texture.js";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.js";
import { BlurPostProcess } from "../../PostProcesses/blurPostProcess.js";

import { Plane } from "../../Maths/math.plane.js";
/**
 * Mirror texture can be used to simulate the view from a mirror in a scene.
 * It will dynamically be rendered every frame to adapt to the camera point of view.
 * You can then easily use it as a reflectionTexture on a flat surface.
 * In case the surface is not a plane, please consider relying on reflection probes.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#mirrortexture
 */
export class MirrorTexture extends RenderTargetTexture {
    /**
     * Define the blur ratio used to blur the reflection if needed.
     */
    set blurRatio(value) {
        if (this._blurRatio === value) {
            return;
        }
        this._blurRatio = value;
        this._preparePostProcesses();
    }
    get blurRatio() {
        return this._blurRatio;
    }
    /**
     * Define the adaptive blur kernel used to blur the reflection if needed.
     * This will autocompute the closest best match for the `blurKernel`
     */
    set adaptiveBlurKernel(value) {
        this._adaptiveBlurKernel = value;
        this._autoComputeBlurKernel();
    }
    /**
     * Define the blur kernel used to blur the reflection if needed.
     * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
     */
    set blurKernel(value) {
        this.blurKernelX = value;
        this.blurKernelY = value;
    }
    /**
     * Define the blur kernel on the X Axis used to blur the reflection if needed.
     * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
     */
    set blurKernelX(value) {
        if (this._blurKernelX === value) {
            return;
        }
        this._blurKernelX = value;
        this._preparePostProcesses();
    }
    get blurKernelX() {
        return this._blurKernelX;
    }
    /**
     * Define the blur kernel on the Y Axis used to blur the reflection if needed.
     * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
     */
    set blurKernelY(value) {
        if (this._blurKernelY === value) {
            return;
        }
        this._blurKernelY = value;
        this._preparePostProcesses();
    }
    get blurKernelY() {
        return this._blurKernelY;
    }
    _autoComputeBlurKernel() {
        const engine = this.getScene().getEngine();
        const dw = this.getRenderWidth() / engine.getRenderWidth();
        const dh = this.getRenderHeight() / engine.getRenderHeight();
        this.blurKernelX = this._adaptiveBlurKernel * dw;
        this.blurKernelY = this._adaptiveBlurKernel * dh;
    }
    _onRatioRescale() {
        if (this._sizeRatio) {
            this.resize(this._initialSizeParameter);
            if (!this._adaptiveBlurKernel) {
                this._preparePostProcesses();
            }
        }
        if (this._adaptiveBlurKernel) {
            this._autoComputeBlurKernel();
        }
    }
    _updateGammaSpace() {
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        this.gammaSpace = !scene.imageProcessingConfiguration.isEnabled || !scene.imageProcessingConfiguration.applyByPostProcess;
    }
    /**
     * Instantiates a Mirror Texture.
     * Mirror texture can be used to simulate the view from a mirror in a scene.
     * It will dynamically be rendered every frame to adapt to the camera point of view.
     * You can then easily use it as a reflectionTexture on a flat surface.
     * In case the surface is not a plane, please consider relying on reflection probes.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#mirrors
     * @param name
     * @param size
     * @param scene
     * @param generateMipMaps
     * @param type
     * @param samplingMode
     * @param generateDepthBuffer
     */
    constructor(name, size, scene, generateMipMaps, type = 0, samplingMode = Texture.BILINEAR_SAMPLINGMODE, generateDepthBuffer = true) {
        super(name, size, scene, generateMipMaps, true, type, false, samplingMode, generateDepthBuffer);
        /**
         * Define the reflection plane we want to use. The mirrorPlane is usually set to the constructed reflector.
         * It is possible to directly set the mirrorPlane by directly using a Plane(a, b, c, d) where a, b and c give the plane normal vector (a, b, c) and d is a scalar displacement from the mirrorPlane to the origin. However in all but the very simplest of situations it is more straight forward to set it to the reflector as stated in the doc.
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#mirrors
         */
        this.mirrorPlane = new Plane(0, 1, 0, 1);
        this._transformMatrix = Matrix.Zero();
        this._mirrorMatrix = Matrix.Zero();
        this._adaptiveBlurKernel = 0;
        this._blurKernelX = 0;
        this._blurKernelY = 0;
        this._blurRatio = 1.0;
        scene = this.getScene();
        if (!scene) {
            return this;
        }
        this.ignoreCameraViewport = true;
        this._updateGammaSpace();
        this._imageProcessingConfigChangeObserver = scene.imageProcessingConfiguration.onUpdateParameters.add(() => {
            this._updateGammaSpace();
        });
        const engine = scene.getEngine();
        if (engine.supportsUniformBuffers) {
            this._sceneUBO = scene.createSceneUniformBuffer(`Scene for Mirror Texture (name "${name}")`);
        }
        let saveClipPlane;
        this.onBeforeRenderObservable.add(() => {
            if (this._sceneUBO) {
                this._currentSceneUBO = scene.getSceneUniformBuffer();
                scene.setSceneUniformBuffer(this._sceneUBO);
                scene.getSceneUniformBuffer().unbindEffect();
            }
            Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
            this._mirrorMatrix.multiplyToRef(scene.getViewMatrix(), this._transformMatrix);
            scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());
            saveClipPlane = scene.clipPlane;
            scene.clipPlane = this.mirrorPlane;
            scene._mirroredCameraPosition = Vector3.TransformCoordinates(scene.activeCamera.globalPosition, this._mirrorMatrix);
        });
        this.onAfterRenderObservable.add(() => {
            if (this._sceneUBO) {
                scene.setSceneUniformBuffer(this._currentSceneUBO);
            }
            scene.updateTransformMatrix();
            scene._mirroredCameraPosition = null;
            scene.clipPlane = saveClipPlane;
        });
    }
    _preparePostProcesses() {
        this.clearPostProcesses(true);
        if (this._blurKernelX && this._blurKernelY) {
            const engine = this.getScene().getEngine();
            const textureType = engine.getCaps().textureFloatRender && engine.getCaps().textureFloatLinearFiltering ? 1 : 2;
            this._blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), this._blurKernelX, this._blurRatio, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
            this._blurX.autoClear = false;
            if (this._blurRatio === 1 && this.samples < 2 && this._texture) {
                this._blurX.inputTexture = this._renderTarget;
            }
            else {
                this._blurX.alwaysForcePOT = true;
            }
            this._blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), this._blurKernelY, this._blurRatio, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
            this._blurY.autoClear = false;
            this._blurY.alwaysForcePOT = this._blurRatio !== 1;
            this.addPostProcess(this._blurX);
            this.addPostProcess(this._blurY);
        }
        else {
            if (this._blurY) {
                this.removePostProcess(this._blurY);
                this._blurY.dispose();
                this._blurY = null;
            }
            if (this._blurX) {
                this.removePostProcess(this._blurX);
                this._blurX.dispose();
                this._blurX = null;
            }
        }
    }
    /**
     * Clone the mirror texture.
     * @returns the cloned texture
     */
    clone() {
        const scene = this.getScene();
        if (!scene) {
            return this;
        }
        const textureSize = this.getSize();
        const newTexture = new MirrorTexture(this.name, textureSize.width, scene, this._renderTargetOptions.generateMipMaps, this._renderTargetOptions.type, this._renderTargetOptions.samplingMode, this._renderTargetOptions.generateDepthBuffer);
        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;
        // Mirror Texture
        newTexture.mirrorPlane = this.mirrorPlane.clone();
        if (this.renderList) {
            newTexture.renderList = this.renderList.slice(0);
        }
        return newTexture;
    }
    /**
     * Serialize the texture to a JSON representation you could use in Parse later on
     * @returns the serialized JSON representation
     */
    serialize() {
        if (!this.name) {
            return null;
        }
        const serializationObject = super.serialize();
        serializationObject.mirrorPlane = this.mirrorPlane.asArray();
        return serializationObject;
    }
    /**
     * Dispose the texture and release its associated resources.
     */
    dispose() {
        super.dispose();
        const scene = this.getScene();
        if (scene) {
            scene.imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingConfigChangeObserver);
        }
        this._sceneUBO?.dispose();
    }
}
Texture._CreateMirror = (name, renderTargetSize, scene, generateMipMaps) => {
    return new MirrorTexture(name, renderTargetSize, scene, generateMipMaps);
};
//# sourceMappingURL=mirrorTexture.js.map