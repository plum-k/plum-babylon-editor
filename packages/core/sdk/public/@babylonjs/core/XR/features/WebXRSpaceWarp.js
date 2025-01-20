import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Matrix } from "../../Maths/math.vector.js";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.js";

import { ShaderMaterial } from "../../Materials/shaderMaterial.js";
import "../../Shaders/velocity.fragment.js";
import "../../Shaders/velocity.vertex.js";
/**
 * Used for Space Warp render process
 */
export class XRSpaceWarpRenderTarget extends RenderTargetTexture {
    /**
     * Creates a Space Warp render target
     * @param motionVectorTexture WebGLTexture provided by WebGLSubImage
     * @param depthStencilTexture WebGLTexture provided by WebGLSubImage
     * @param scene scene used with the render target
     * @param size the size of the render target (used for each view)
     */
    constructor(motionVectorTexture, depthStencilTexture, scene, size = 512) {
        super("spacewarp rtt", size, scene, false, true, 2, false, undefined, false, false, true, undefined, true);
        this._originalPairing = [];
        this._previousWorldMatrices = [];
        this._previousTransforms = [Matrix.Identity(), Matrix.Identity()];
        this._renderTarget = this.getScene().getEngine().createMultiviewRenderTargetTexture(this.getRenderWidth(), this.getRenderHeight(), motionVectorTexture, depthStencilTexture);
        this._renderTarget._disposeOnlyFramebuffers = true;
        this._texture = this._renderTarget.texture;
        this._texture.isMultiview = true;
        this._texture.format = 5;
        if (scene) {
            this._velocityMaterial = new ShaderMaterial("velocity shader material", scene, {
                vertex: "velocity",
                fragment: "velocity",
            }, {
                uniforms: ["world", "previousWorld", "viewProjection", "viewProjectionR", "previousViewProjection", "previousViewProjectionR"],
            });
            this._velocityMaterial._materialHelperNeedsPreviousMatrices = true;
            this._velocityMaterial.onBindObservable.add((mesh) => {
                // mesh. getWorldMatrix can be incorrect under rare conditions (e.g. when using a effective mesh in the render function).
                // If the case arise that will require changing it we will need to change the bind process in the material class to also provide the world matrix as a parameter
                this._previousWorldMatrices[mesh.uniqueId] = this._previousWorldMatrices[mesh.uniqueId] || mesh.getWorldMatrix();
                this._velocityMaterial.getEffect().setMatrix("previousWorld", this._previousWorldMatrices[mesh.uniqueId]);
                this._previousWorldMatrices[mesh.uniqueId] = mesh.getWorldMatrix();
                // now set the scene's previous matrix
                this._velocityMaterial.getEffect().setMatrix("previousViewProjection", this._previousTransforms[0]);
                // multiview for sure
                this._velocityMaterial.getEffect().setMatrix("previousViewProjectionR", this._previousTransforms[1]);
                // store the previous (current, to be exact) transforms
                this._previousTransforms[0].copyFrom(scene.getTransformMatrix());
                this._previousTransforms[1].copyFrom(scene._transformMatrixR);
            });
            this._velocityMaterial.freeze();
        }
    }
    render(useCameraPostProcess = false, dumpForDebug = false) {
        // Swap to use velocity material
        this._originalPairing.length = 0;
        const scene = this.getScene();
        // set the velocity material to render the velocity RTT
        if (scene && this._velocityMaterial) {
            scene.getActiveMeshes().forEach((mesh) => {
                this._originalPairing.push([mesh, mesh.material]);
                mesh.material = this._velocityMaterial;
            });
        }
        super.render(useCameraPostProcess, dumpForDebug);
        // Restore original materials
        this._originalPairing.forEach((tuple) => {
            tuple[0].material = tuple[1];
        });
    }
    /**
     * @internal
     */
    _bindFrameBuffer() {
        if (!this._renderTarget) {
            return;
        }
        this.getScene().getEngine().bindSpaceWarpFramebuffer(this._renderTarget);
    }
    /**
     * Gets the number of views the corresponding to the texture (eg. a SpaceWarpRenderTarget will have > 1)
     * @returns the view count
     */
    getViewCount() {
        return 2;
    }
    dispose() {
        super.dispose();
        this._velocityMaterial.dispose();
        this._previousTransforms.length = 0;
        this._previousWorldMatrices.length = 0;
        this._originalPairing.length = 0;
    }
}
/**
 * WebXR Space Warp Render Target Texture Provider
 */
export class WebXRSpaceWarpRenderTargetTextureProvider {
    constructor(_scene, _xrSessionManager, _xrWebGLBinding) {
        this._scene = _scene;
        this._xrSessionManager = _xrSessionManager;
        this._xrWebGLBinding = _xrWebGLBinding;
        this._lastSubImages = new Map();
        this._renderTargetTextures = new Map();
        this._engine = _scene.getEngine();
    }
    _getSubImageForView(view) {
        const layerWrapper = this._xrSessionManager._getBaseLayerWrapper();
        if (!layerWrapper) {
            throw new Error("For Space Warp, the base layer should be a WebXR Projection Layer.");
        }
        if (layerWrapper.layerType !== "XRProjectionLayer") {
            throw new Error('For Space Warp, the base layer type should "XRProjectionLayer".');
        }
        const layer = layerWrapper.layer;
        return this._xrWebGLBinding.getViewSubImage(layer, view);
    }
    _setViewportForSubImage(viewport, subImage) {
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = subImage.motionVectorTextureWidth;
        viewport.height = subImage.motionVectorTextureHeight;
    }
    _createRenderTargetTexture(width, height, framebuffer, motionVectorTexture, depthStencilTexture) {
        if (!this._engine) {
            throw new Error("Engine is disposed");
        }
        const textureSize = { width, height };
        // Create render target texture from the internal texture
        const renderTargetTexture = new XRSpaceWarpRenderTarget(motionVectorTexture, depthStencilTexture, this._scene, textureSize);
        const renderTargetWrapper = renderTargetTexture.renderTarget;
        if (framebuffer) {
            renderTargetWrapper._framebuffer = framebuffer;
        }
        // Create internal texture
        renderTargetWrapper._colorTextureArray = motionVectorTexture;
        renderTargetWrapper._depthStencilTextureArray = depthStencilTexture;
        renderTargetTexture.disableRescaling();
        renderTargetTexture.renderListPredicate = () => true;
        return renderTargetTexture;
    }
    _getRenderTargetForSubImage(subImage, view) {
        const lastSubImage = this._lastSubImages.get(view);
        let renderTargetTexture = this._renderTargetTextures.get(view.eye);
        const width = subImage.motionVectorTextureWidth;
        const height = subImage.motionVectorTextureHeight;
        if (!renderTargetTexture || lastSubImage?.textureWidth !== width || lastSubImage?.textureHeight != height) {
            renderTargetTexture = this._createRenderTargetTexture(width, height, null, subImage.motionVectorTexture, subImage.depthStencilTexture);
            this._renderTargetTextures.set(view.eye, renderTargetTexture);
            this._framebufferDimensions = {
                framebufferWidth: width,
                framebufferHeight: height,
            };
        }
        this._lastSubImages.set(view, subImage);
        return renderTargetTexture;
    }
    trySetViewportForView(viewport, view) {
        const subImage = this._lastSubImages.get(view) || this._getSubImageForView(view);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
    /**
     * Access the motion vector (which will turn on Space Warp)
     * @param view the view to access the motion vector texture for
     */
    accessMotionVector(view) {
        const subImage = this._getSubImageForView(view);
        if (subImage) {
            // Meta Quest Browser uses accessing these textures as a sign for turning on Space Warp
            subImage.motionVectorTexture;
            subImage.depthStencilTexture;
        }
    }
    getRenderTargetTextureForEye(_eye) {
        return null;
    }
    getRenderTargetTextureForView(view) {
        const subImage = this._getSubImageForView(view);
        if (subImage) {
            return this._getRenderTargetForSubImage(subImage, view);
        }
        return null;
    }
    dispose() {
        this._renderTargetTextures.forEach((rtt) => rtt.dispose());
        this._renderTargetTextures.clear();
    }
}
/**
 * the WebXR Space Warp feature.
 */
export class WebXRSpaceWarp extends WebXRAbstractFeature {
    /**
     * constructor for the space warp feature
     * @param _xrSessionManager the xr session manager for this feature
     */
    constructor(_xrSessionManager) {
        super(_xrSessionManager);
        this._onAfterRenderObserver = null;
        this.dependsOn = [WebXRFeatureName.LAYERS];
        this.xrNativeFeatureName = "space-warp";
        this._xrSessionManager.scene.needsPreviousWorldMatrices = true;
    }
    /**
     * Attach this feature.
     * Will usually be called by the features manager.
     *
     * @returns true if successful.
     */
    attach() {
        if (!super.attach()) {
            return false;
        }
        const engine = this._xrSessionManager.scene.getEngine();
        this._glContext = engine._gl;
        this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, this._glContext);
        this.spaceWarpRTTProvider = new WebXRSpaceWarpRenderTargetTextureProvider(this._xrSessionManager.scene, this._xrSessionManager, this._xrWebGLBinding);
        this._onAfterRenderObserver = this._xrSessionManager.scene.onAfterRenderObservable.add(() => this._onAfterRender());
        return true;
    }
    detach() {
        this._xrSessionManager.scene.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        return super.detach();
    }
    _onAfterRender() {
        if (this.attached && this._renderTargetTexture) {
            this._renderTargetTexture.render(false, false);
        }
    }
    isCompatible() {
        return this._xrSessionManager.scene.getEngine().getCaps().colorBufferHalfFloat || false;
    }
    dispose() {
        super.dispose();
    }
    _onXRFrame(_xrFrame) {
        const pose = _xrFrame.getViewerPose(this._xrSessionManager.referenceSpace);
        if (!pose) {
            return;
        }
        // get the first view to which we will create a texture (or update it)
        const view = pose.views[0];
        this._renderTargetTexture = this._renderTargetTexture || this.spaceWarpRTTProvider.getRenderTargetTextureForView(view);
        this.spaceWarpRTTProvider.accessMotionVector(view);
    }
}
/**
 * The module's name
 */
WebXRSpaceWarp.Name = WebXRFeatureName.SPACE_WARP;
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the WebXR specs version
 */
WebXRSpaceWarp.Version = 1;
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(WebXRSpaceWarp.Name, (xrSessionManager) => {
    return () => new WebXRSpaceWarp(xrSessionManager);
}, WebXRSpaceWarp.Version, false);
//# sourceMappingURL=WebXRSpaceWarp.js.map