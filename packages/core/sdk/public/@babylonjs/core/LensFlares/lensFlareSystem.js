import { Tools } from "../Misc/tools.js";
import { Matrix, Vector3 } from "../Maths/math.vector.js";
import { Clamp } from "../Maths/math.scalar.functions.js";
import { EngineStore } from "../Engines/engineStore.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Ray } from "../Culling/ray.js";
import { Material } from "../Materials/material.js";
import { LensFlare } from "./lensFlare.js";

import { _WarnImport } from "../Misc/devTools.js";
import { Color3 } from "../Maths/math.color.js";
import { Observable } from "../Misc/observable.js";
/**
 * This represents a Lens Flare System or the shiny effect created by the light reflection on the  camera lenses.
 * It is usually composed of several `lensFlare`.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
 */
export class LensFlareSystem {
    /** Gets the scene */
    get scene() {
        return this._scene;
    }
    /**
     * Gets the shader language used in this system.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Instantiates a lens flare system.
     * This represents a Lens Flare System or the shiny effect created by the light reflection on the  camera lenses.
     * It is usually composed of several `lensFlare`.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
     * @param name Define the name of the lens flare system in the scene
     * @param emitter Define the source (the emitter) of the lens flares (it can be a camera, a light or a mesh).
     * @param scene Define the scene the lens flare system belongs to
     */
    constructor(
    /**
     * Define the name of the lens flare system
     */
    name, emitter, scene) {
        this.name = name;
        /**
         * List of lens flares used in this system.
         */
        this.lensFlares = [];
        /**
         * Define a limit from the border the lens flare can be visible.
         */
        this.borderLimit = 300;
        /**
         * Define a viewport border we do not want to see the lens flare in.
         */
        this.viewportBorder = 0;
        /**
         * Restricts the rendering of the effect to only the camera rendering this layer mask.
         */
        this.layerMask = 0x0fffffff;
        /** Shader language used by the system */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._vertexBuffers = {};
        this._isEnabled = true;
        /** @internal */
        this._onShadersLoaded = new Observable(undefined, true);
        this._shadersLoaded = false;
        this._scene = scene || EngineStore.LastCreatedScene;
        LensFlareSystem._SceneComponentInitialization(this._scene);
        this._emitter = emitter;
        this.id = name;
        scene.lensFlareSystems.push(this);
        this.meshesSelectionPredicate = (m) => (scene.activeCamera && m.material && m.isVisible && m.isEnabled() && m.isBlocker && (m.layerMask & scene.activeCamera.layerMask) != 0);
        const engine = scene.getEngine();
        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);
        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);
        // Indices
        this._createIndexBuffer();
        this._initShaderSourceAsync();
    }
    async _initShaderSourceAsync() {
        const engine = this._scene.getEngine();
        if (engine.isWebGPU && !LensFlareSystem.ForceGLSL) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
            await Promise.all([import("../ShadersWGSL/lensFlare.fragment.js"), import("../ShadersWGSL/lensFlare.vertex.js")]);
        }
        else {
            await Promise.all([import("../Shaders/lensFlare.fragment.js"), import("../Shaders/lensFlare.vertex.js")]);
        }
        this._shadersLoaded = true;
        this._onShadersLoaded.notifyObservers();
    }
    _createIndexBuffer() {
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);
        indices.push(0);
        indices.push(2);
        indices.push(3);
        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
    }
    /**
     * Define if the lens flare system is enabled.
     */
    get isEnabled() {
        return this._isEnabled;
    }
    set isEnabled(value) {
        this._isEnabled = value;
    }
    /**
     * Get the scene the effects belongs to.
     * @returns the scene holding the lens flare system
     */
    getScene() {
        return this._scene;
    }
    /**
     * Get the emitter of the lens flare system.
     * It defines the source of the lens flares (it can be a camera, a light or a mesh).
     * @returns the emitter of the lens flare system
     */
    getEmitter() {
        return this._emitter;
    }
    /**
     * Set the emitter of the lens flare system.
     * It defines the source of the lens flares (it can be a camera, a light or a mesh).
     * @param newEmitter Define the new emitter of the system
     */
    setEmitter(newEmitter) {
        this._emitter = newEmitter;
    }
    /**
     * Get the lens flare system emitter position.
     * The emitter defines the source of the lens flares (it can be a camera, a light or a mesh).
     * @returns the position
     */
    getEmitterPosition() {
        return this._emitter.getAbsolutePosition ? this._emitter.getAbsolutePosition() : this._emitter.position;
    }
    /**
     * @internal
     */
    computeEffectivePosition(globalViewport) {
        let position = this.getEmitterPosition();
        position = Vector3.Project(position, Matrix.Identity(), this._scene.getTransformMatrix(), globalViewport);
        this._positionX = position.x;
        this._positionY = position.y;
        position = Vector3.TransformCoordinates(this.getEmitterPosition(), this._scene.getViewMatrix());
        if (this.viewportBorder > 0) {
            globalViewport.x -= this.viewportBorder;
            globalViewport.y -= this.viewportBorder;
            globalViewport.width += this.viewportBorder * 2;
            globalViewport.height += this.viewportBorder * 2;
            position.x += this.viewportBorder;
            position.y += this.viewportBorder;
            this._positionX += this.viewportBorder;
            this._positionY += this.viewportBorder;
        }
        const rhs = this._scene.useRightHandedSystem;
        const okZ = (position.z > 0 && !rhs) || (position.z < 0 && rhs);
        if (okZ) {
            if (this._positionX > globalViewport.x && this._positionX < globalViewport.x + globalViewport.width) {
                if (this._positionY > globalViewport.y && this._positionY < globalViewport.y + globalViewport.height) {
                    return true;
                }
            }
            return true;
        }
        return false;
    }
    /** @internal */
    _isVisible() {
        if (!this._isEnabled || !this._scene.activeCamera) {
            return false;
        }
        const emitterPosition = this.getEmitterPosition();
        const direction = emitterPosition.subtract(this._scene.activeCamera.globalPosition);
        const distance = direction.length();
        direction.normalize();
        const ray = new Ray(this._scene.activeCamera.globalPosition, direction);
        const pickInfo = this._scene.pickWithRay(ray, this.meshesSelectionPredicate, true);
        return !pickInfo || !pickInfo.hit || pickInfo.distance > distance;
    }
    /**
     * @internal
     */
    render() {
        if (!this._scene.activeCamera || !this._shadersLoaded) {
            return false;
        }
        const engine = this._scene.getEngine();
        const viewport = this._scene.activeCamera.viewport;
        const globalViewport = viewport.toGlobal(engine.getRenderWidth(true), engine.getRenderHeight(true));
        // Position
        if (!this.computeEffectivePosition(globalViewport)) {
            return false;
        }
        // Visibility
        if (!this._isVisible()) {
            return false;
        }
        // Intensity
        let awayX;
        let awayY;
        if (this._positionX < this.borderLimit + globalViewport.x) {
            awayX = this.borderLimit + globalViewport.x - this._positionX;
        }
        else if (this._positionX > globalViewport.x + globalViewport.width - this.borderLimit) {
            awayX = this._positionX - globalViewport.x - globalViewport.width + this.borderLimit;
        }
        else {
            awayX = 0;
        }
        if (this._positionY < this.borderLimit + globalViewport.y) {
            awayY = this.borderLimit + globalViewport.y - this._positionY;
        }
        else if (this._positionY > globalViewport.y + globalViewport.height - this.borderLimit) {
            awayY = this._positionY - globalViewport.y - globalViewport.height + this.borderLimit;
        }
        else {
            awayY = 0;
        }
        let away = awayX > awayY ? awayX : awayY;
        away -= this.viewportBorder;
        if (away > this.borderLimit) {
            away = this.borderLimit;
        }
        let intensity = 1.0 - Clamp(away / this.borderLimit, 0, 1);
        if (intensity < 0) {
            return false;
        }
        if (intensity > 1.0) {
            intensity = 1.0;
        }
        if (this.viewportBorder > 0) {
            globalViewport.x += this.viewportBorder;
            globalViewport.y += this.viewportBorder;
            globalViewport.width -= this.viewportBorder * 2;
            globalViewport.height -= this.viewportBorder * 2;
            this._positionX -= this.viewportBorder;
            this._positionY -= this.viewportBorder;
        }
        // Position
        const centerX = globalViewport.x + globalViewport.width / 2;
        const centerY = globalViewport.y + globalViewport.height / 2;
        const distX = centerX - this._positionX;
        const distY = centerY - this._positionY;
        // Effects
        engine.setState(false);
        engine.setDepthBuffer(false);
        // Flares
        for (let index = 0; index < this.lensFlares.length; index++) {
            const flare = this.lensFlares[index];
            if (!flare._drawWrapper.effect.isReady() || (flare.texture && !flare.texture.isReady())) {
                continue;
            }
            engine.enableEffect(flare._drawWrapper);
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, flare._drawWrapper.effect);
            engine.setAlphaMode(flare.alphaMode);
            const x = centerX - distX * flare.position;
            const y = centerY - distY * flare.position;
            const cw = flare.size;
            const ch = flare.size * engine.getAspectRatio(this._scene.activeCamera, true);
            const cx = 2 * ((x - globalViewport.x) / globalViewport.width) - 1.0;
            const cy = 1.0 - 2 * ((y - globalViewport.y) / globalViewport.height);
            const viewportMatrix = Matrix.FromValues(cw / 2, 0, 0, 0, 0, ch / 2, 0, 0, 0, 0, 1, 0, cx, cy, 0, 1);
            flare._drawWrapper.effect.setMatrix("viewportMatrix", viewportMatrix);
            // Texture
            flare._drawWrapper.effect.setTexture("textureSampler", flare.texture);
            // Color
            flare._drawWrapper.effect.setFloat4("color", flare.color.r * intensity, flare.color.g * intensity, flare.color.b * intensity, 1.0);
            // Draw order
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        engine.setDepthBuffer(true);
        engine.setAlphaMode(0);
        return true;
    }
    /**
     * Rebuilds the lens flare system
     */
    rebuild() {
        this._createIndexBuffer();
        for (const key in this._vertexBuffers) {
            this._vertexBuffers[key]?._rebuild();
        }
    }
    /**
     * Dispose and release the lens flare with its associated resources.
     */
    dispose() {
        this._onShadersLoaded.clear();
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }
        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
        while (this.lensFlares.length) {
            this.lensFlares[0].dispose();
        }
        // Remove from scene
        const index = this._scene.lensFlareSystems.indexOf(this);
        this._scene.lensFlareSystems.splice(index, 1);
    }
    /**
     * Parse a lens flare system from a JSON representation
     * @param parsedLensFlareSystem Define the JSON to parse
     * @param scene Define the scene the parsed system should be instantiated in
     * @param rootUrl Define the rootUrl of the load sequence to easily find a load relative dependencies such as textures
     * @returns the parsed system
     */
    static Parse(parsedLensFlareSystem, scene, rootUrl) {
        const emitter = scene.getLastEntryById(parsedLensFlareSystem.emitterId);
        const name = parsedLensFlareSystem.name || "lensFlareSystem#" + parsedLensFlareSystem.emitterId;
        const lensFlareSystem = new LensFlareSystem(name, emitter, scene);
        lensFlareSystem.id = parsedLensFlareSystem.id || name;
        lensFlareSystem.borderLimit = parsedLensFlareSystem.borderLimit;
        for (let index = 0; index < parsedLensFlareSystem.flares.length; index++) {
            const parsedFlare = parsedLensFlareSystem.flares[index];
            LensFlare.AddFlare(parsedFlare.size, parsedFlare.position, Color3.FromArray(parsedFlare.color), parsedFlare.textureName ? rootUrl + parsedFlare.textureName : "", lensFlareSystem);
        }
        return lensFlareSystem;
    }
    /**
     * Serialize the current Lens Flare System into a JSON representation.
     * @returns the serialized JSON
     */
    serialize() {
        const serializationObject = {};
        serializationObject.id = this.id;
        serializationObject.name = this.name;
        serializationObject.emitterId = this.getEmitter().id;
        serializationObject.borderLimit = this.borderLimit;
        serializationObject.flares = [];
        for (let index = 0; index < this.lensFlares.length; index++) {
            const flare = this.lensFlares[index];
            serializationObject.flares.push({
                size: flare.size,
                position: flare.position,
                color: flare.color.asArray(),
                textureName: Tools.GetFilename(flare.texture ? flare.texture.name : ""),
            });
        }
        return serializationObject;
    }
}
/**
 * Force all the lens flare systems to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
LensFlareSystem.ForceGLSL = false;
/**
 * @internal
 */
LensFlareSystem._SceneComponentInitialization = (_) => {
    throw _WarnImport("LensFlareSystemSceneComponent");
};
//# sourceMappingURL=lensFlareSystem.js.map