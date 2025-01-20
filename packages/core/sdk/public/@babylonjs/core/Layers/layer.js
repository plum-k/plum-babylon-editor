import { Observable } from "../Misc/observable.js";
import { Vector2 } from "../Maths/math.vector.js";
import { Color4 } from "../Maths/math.color.js";
import { EngineStore } from "../Engines/engineStore.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Material } from "../Materials/material.js";
import { Texture } from "../Materials/Textures/texture.js";
import { SceneComponentConstants } from "../sceneComponent.js";
import { LayerSceneComponent } from "./layerSceneComponent.js";

import { DrawWrapper } from "../Materials/drawWrapper.js";
/**
 * This represents a full screen 2d layer.
 * This can be useful to display a picture in the  background of your scene for instance.
 * @see https://www.babylonjs-playground.com/#08A2BS#1
 */
export class Layer {
    /**
     * Determines if the layer is drawn before (true) or after (false) post-processing.
     * If the layer is background, it is always before.
     */
    set applyPostProcess(value) {
        this._applyPostProcess = value;
    }
    get applyPostProcess() {
        return this.isBackground || this._applyPostProcess;
    }
    /**
     * Back compatibility with callback before the onDisposeObservable existed.
     * The set callback will be triggered when the layer has been disposed.
     */
    set onDispose(callback) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }
    /**
     * Back compatibility with callback before the onBeforeRenderObservable existed.
     * The set callback will be triggered just before rendering the layer.
     */
    set onBeforeRender(callback) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
    }
    /**
     * Back compatibility with callback before the onAfterRenderObservable existed.
     * The set callback will be triggered just after rendering the layer.
     */
    set onAfterRender(callback) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
    }
    /**
     * Gets the shader language used in this material.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Instantiates a new layer.
     * This represents a full screen 2d layer.
     * This can be useful to display a picture in the  background of your scene for instance.
     * @see https://www.babylonjs-playground.com/#08A2BS#1
     * @param name Define the name of the layer in the scene
     * @param imgUrl Define the url of the texture to display in the layer
     * @param scene Define the scene the layer belongs to
     * @param isBackground Defines whether the layer is displayed in front or behind the scene
     * @param color Defines a color for the layer
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(
    /**
     * Define the name of the layer.
     */
    name, imgUrl, scene, isBackground, color, forceGLSL = false) {
        this.name = name;
        this._applyPostProcess = true;
        /**
         * Define the scale of the layer in order to zoom in out of the texture.
         */
        this.scale = new Vector2(1, 1);
        /**
         * Define an offset for the layer in order to shift the texture.
         */
        this.offset = new Vector2(0, 0);
        /**
         * Define the alpha blending mode used in the layer in case the texture or color has an alpha.
         */
        this.alphaBlendingMode = 2;
        /**
         * Define a mask to restrict the layer to only some of the scene cameras.
         */
        this.layerMask = 0x0fffffff;
        /**
         * Define the list of render target the layer is visible into.
         */
        this.renderTargetTextures = [];
        /**
         * Define if the layer is only used in renderTarget or if it also
         * renders in the main frame buffer of the canvas.
         */
        this.renderOnlyInRenderTargetTextures = false;
        /**
         * Define if the colors of the layer should be generated in linear space (default: false)
         */
        this.convertToLinearSpace = false;
        /**
         * Define if the layer is enabled (ie. should be displayed). Default: true
         */
        this.isEnabled = true;
        this._vertexBuffers = {};
        /**
         * An event triggered when the layer is disposed.
         */
        this.onDisposeObservable = new Observable();
        /**
         * An event triggered before rendering the scene
         */
        this.onBeforeRenderObservable = new Observable();
        /**
         * An event triggered after rendering the scene
         */
        this.onAfterRenderObservable = new Observable();
        /** Shader language used by the material */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._shadersLoaded = false;
        this.texture = imgUrl ? new Texture(imgUrl, scene, true) : null;
        this.isBackground = isBackground === undefined ? true : isBackground;
        this.color = color === undefined ? new Color4(1, 1, 1, 1) : color;
        this._scene = (scene || EngineStore.LastCreatedScene);
        const engine = this._scene.getEngine();
        if (engine.isWebGPU && !forceGLSL && !Layer.ForceGLSL) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
        let layerComponent = this._scene._getComponent(SceneComponentConstants.NAME_LAYER);
        if (!layerComponent) {
            layerComponent = new LayerSceneComponent(this._scene);
            this._scene._addComponent(layerComponent);
        }
        this._scene.layers.push(this);
        this._drawWrapper = new DrawWrapper(engine);
        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);
        const vertexBuffer = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);
        this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;
        this._createIndexBuffer();
    }
    _createIndexBuffer() {
        const engine = this._scene.getEngine();
        // Indices
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);
        indices.push(0);
        indices.push(2);
        indices.push(3);
        this._indexBuffer = engine.createIndexBuffer(indices);
    }
    /** @internal */
    _rebuild() {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vb) {
            vb._rebuild();
        }
        this._createIndexBuffer();
    }
    /**
     * Checks if the layer is ready to be rendered
     * @returns true if the layer is ready. False otherwise.
     */
    isReady() {
        const engine = this._scene.getEngine();
        let defines = "";
        if (this.alphaTest) {
            defines = "#define ALPHATEST";
        }
        if (this.texture) {
            if (this.texture.gammaSpace) {
                if (this.convertToLinearSpace) {
                    defines += "\n#define CONVERT_TO_LINEAR";
                }
            }
            else if (!this.convertToLinearSpace) {
                defines += "\n#define CONVERT_TO_GAMMA";
            }
        }
        if (this._previousDefines !== defines) {
            this._previousDefines = defines;
            this._drawWrapper.effect = engine.createEffect("layer", [VertexBuffer.PositionKind], ["textureMatrix", "color", "scale", "offset"], ["textureSampler"], defines, undefined, undefined, undefined, undefined, this._shaderLanguage, this._shadersLoaded
                ? undefined
                : async () => {
                    if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                        await Promise.all([import("../ShadersWGSL/layer.vertex.js"), import("../ShadersWGSL/layer.fragment.js")]);
                    }
                    else {
                        await Promise.all([import("../Shaders/layer.vertex.js"), import("../Shaders/layer.fragment.js")]);
                    }
                    this._shadersLoaded = true;
                });
        }
        const currentEffect = this._drawWrapper.effect;
        return !!currentEffect?.isReady() && (!this.texture || this.texture.isReady());
    }
    /**
     * Renders the layer in the scene.
     */
    render() {
        if (!this.isEnabled) {
            return;
        }
        const engine = this._scene.getEngine();
        // Check
        if (!this.isReady()) {
            return;
        }
        const currentEffect = this._drawWrapper.effect;
        this.onBeforeRenderObservable.notifyObservers(this);
        // Render
        engine.enableEffect(this._drawWrapper);
        engine.setState(false);
        // Texture
        if (this.texture) {
            currentEffect.setTexture("textureSampler", this.texture);
            currentEffect.setMatrix("textureMatrix", this.texture.getTextureMatrix());
        }
        // Color
        currentEffect.setFloat4("color", this.color.r, this.color.g, this.color.b, this.color.a);
        // Scale / offset
        currentEffect.setVector2("offset", this.offset);
        currentEffect.setVector2("scale", this.scale);
        // VBOs
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);
        // Draw order
        if (!this.alphaTest) {
            engine.setAlphaMode(this.alphaBlendingMode);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
            engine.setAlphaMode(0);
        }
        else {
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        this.onAfterRenderObservable.notifyObservers(this);
    }
    /**
     * Disposes and releases the associated resources.
     */
    dispose() {
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }
        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
        // Clean RTT list
        this.renderTargetTextures = [];
        // Remove from scene
        const index = this._scene.layers.indexOf(this);
        this._scene.layers.splice(index, 1);
        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onBeforeRenderObservable.clear();
    }
}
/**
 * Force all the layers to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
Layer.ForceGLSL = false;
//# sourceMappingURL=layer.js.map