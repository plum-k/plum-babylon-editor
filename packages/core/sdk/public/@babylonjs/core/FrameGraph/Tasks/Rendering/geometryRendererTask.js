import { backbufferDepthStencilTextureHandle } from "../../frameGraphTypes.js";
import { Color4 } from "../../../Maths/math.color.js";
import { MaterialHelperGeometryRendering } from "../../../Materials/materialHelper.geometryrendering.js";

import { FrameGraphTask } from "../../frameGraphTask.js";
import { ObjectRenderer } from "../../../Rendering/objectRenderer.js";
const clearColors = [new Color4(0, 0, 0, 0), new Color4(1, 1, 1, 1), new Color4(1e8, 1e8, 1e8, 1e8)];
/**
 * Task used to render geometry to a set of textures.
 */
export class FrameGraphGeometryRendererTask extends FrameGraphTask {
    /**
     * Gets or sets the camera used for rendering.
     */
    get camera() {
        return this._camera;
    }
    set camera(camera) {
        this._camera = camera;
        this._renderer.activeCamera = this.camera;
    }
    /**
     * The object renderer used by the geometry renderer task.
     */
    get objectRenderer() {
        return this._renderer;
    }
    /**
     * Gets or sets the name of the task.
     */
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
        if (this._renderer) {
            this._renderer.name = value;
        }
    }
    /**
     * Constructs a new geometry renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     */
    constructor(name, frameGraph, scene, options) {
        super(name, frameGraph);
        /**
         * Whether depth testing is enabled (default is true).
         */
        this.depthTest = true;
        /**
         * Whether depth writing is enabled (default is true).
         */
        this.depthWrite = true;
        /**
         * The size of the output textures (default is 100% of the back buffer texture size).
         */
        this.size = { width: 100, height: 100 };
        /**
         * Whether the size is a percentage of the back buffer size (default is true).
         */
        this.sizeIsPercentage = true;
        /**
         * The number of samples to use for the output textures (default is 1).
         */
        this.samples = 1;
        /**
         * The list of texture descriptions used by the geometry renderer task.
         */
        this.textureDescriptions = [];
        this._scene = scene;
        this._engine = this._scene.getEngine();
        this._renderer = new ObjectRenderer(name, scene, options);
        this._renderer.renderSprites = false;
        this._renderer.renderParticles = false;
        this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
            if (!this._renderer.options.doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
        });
        this.name = name;
        this._clearAttachmentsLayout = new Map();
        this._allAttachmentsLayout = [];
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryViewDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryScreenDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryViewNormalTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryWorldNormalTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryLocalPositionTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryWorldPositionTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryAlbedoTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryReflectivityTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryVelocityTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryLinearVelocityTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    /**
     * Gets the list of excluded meshes from the velocity texture.
     */
    get excludedSkinnedMeshFromVelocityTexture() {
        return MaterialHelperGeometryRendering.GetConfiguration(this._renderer.renderPassId).excludedSkinnedMesh;
    }
    isReady() {
        return this._renderer.isReadyForRendering(this._textureWidth, this._textureHeight);
    }
    record() {
        if (this.textureDescriptions.length === 0 || this.objectList === undefined) {
            throw new Error(`FrameGraphGeometryRendererTask ${this.name}: object list and at least one geometry texture description must be provided`);
        }
        // Make sure the renderList / particleSystemList are set when FrameGraphGeometryRendererTask.isReady() is called!
        this._renderer.renderList = this.objectList.meshes;
        this._renderer.particleSystemList = this.objectList.particleSystems;
        const outputTextureHandle = this._createMultiRenderTargetTexture();
        const depthEnabled = this._checkDepthTextureCompatibility();
        this._buildClearAttachmentsLayout();
        this._registerForRenderPassId(this._renderer.renderPassId);
        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(outputTextureHandle[0]);
        this._textureWidth = outputTextureDescription.size.width;
        this._textureHeight = outputTextureDescription.size.height;
        // Create pass
        MaterialHelperGeometryRendering.MarkAsDirty(this._renderer.renderPassId, this.objectList.meshes || this._scene.meshes);
        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(outputTextureHandle);
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const handle = outputTextureHandle[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];
            switch (geometryDescription.type) {
                case 5:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryViewDepthTexture, handle);
                    break;
                case 10:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryScreenDepthTexture, handle);
                    break;
                case 6:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryViewNormalTexture, handle);
                    break;
                case 8:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryWorldNormalTexture, handle);
                    break;
                case 9:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryLocalPositionTexture, handle);
                    break;
                case 1:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryWorldPositionTexture, handle);
                    break;
                case 12:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryAlbedoTexture, handle);
                    break;
                case 3:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryReflectivityTexture, handle);
                    break;
                case 2:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryVelocityTexture, handle);
                    break;
                case 11:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryLinearVelocityTexture, handle);
                    break;
            }
        }
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;
            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
            this._clearAttachmentsLayout.forEach((layout, clearType) => {
                context.clearColorAttachments(clearColors[clearType], layout);
            });
            context.bindAttachments(this._allAttachmentsLayout);
            context.render(this._renderer, this._textureWidth, this._textureHeight);
        });
    }
    dispose() {
        MaterialHelperGeometryRendering.DeleteConfiguration(this._renderer.renderPassId);
        this._renderer.dispose();
        super.dispose();
    }
    _createMultiRenderTargetTexture() {
        const types = [];
        const formats = [];
        const labels = [];
        const useSRGBBuffers = [];
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            if (index === -1) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: unknown texture type ${description.type}`);
            }
            types[i] = description.textureType;
            formats[i] = description.textureFormat;
            labels[i] = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index].name;
            useSRGBBuffers[i] = false;
        }
        const baseHandle = this._frameGraph.textureManager.createRenderTargetTexture(this.name, {
            size: this.size,
            sizeIsPercentage: this.sizeIsPercentage,
            options: {
                createMipMaps: false,
                samples: this.samples,
                types,
                formats,
                useSRGBBuffers,
                labels,
            },
        });
        const handles = [];
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            handles.push(baseHandle + i);
        }
        return handles;
    }
    _checkDepthTextureCompatibility() {
        let depthEnabled = false;
        if (this.depthTexture !== undefined) {
            if (this.depthTexture === backbufferDepthStencilTextureHandle) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth/stencil back buffer is not allowed as a depth texture`);
            }
            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== this.samples) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
            depthEnabled = true;
        }
        return depthEnabled;
    }
    _buildClearAttachmentsLayout() {
        const clearAttachmentsLayout = new Map();
        const allAttachmentsLayout = [];
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];
            let layout = clearAttachmentsLayout.get(geometryDescription.clearType);
            if (layout === undefined) {
                layout = [];
                clearAttachmentsLayout.set(geometryDescription.clearType, layout);
                for (let j = 0; j < i; j++) {
                    layout[j] = false;
                }
            }
            clearAttachmentsLayout.forEach((layout, clearType) => {
                layout.push(clearType === geometryDescription.clearType);
            });
            allAttachmentsLayout.push(true);
        }
        this._clearAttachmentsLayout = new Map();
        clearAttachmentsLayout.forEach((layout, clearType) => {
            this._clearAttachmentsLayout.set(clearType, this._engine.buildTextureLayout(layout));
        });
        this._allAttachmentsLayout = this._engine.buildTextureLayout(allAttachmentsLayout);
    }
    _registerForRenderPassId(renderPassId) {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];
            configuration.defines[geometryDescription.defineIndex] = i;
        }
    }
}
//# sourceMappingURL=geometryRendererTask.js.map