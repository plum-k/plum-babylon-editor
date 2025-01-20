
import { Buffer, VertexBuffer } from "../Buffers/buffer.js";
import { DrawWrapper } from "../Materials/drawWrapper.js";
import { Logger } from "../Misc/logger.js";
import { BindLogDepth } from "../Materials/materialHelper.functions.js";
/**
 * Class used to render sprites.
 *
 * It can be used either to render Sprites or ThinSprites with ThinEngine only.
 */
export class SpriteRenderer {
    /**
     * Gets or sets a boolean indicating if the manager must consider scene fog when rendering
     */
    get fogEnabled() {
        return this._fogEnabled;
    }
    set fogEnabled(value) {
        if (this._fogEnabled === value) {
            return;
        }
        this._fogEnabled = value;
        this._createEffects();
    }
    /**
     * In case the depth buffer does not allow enough depth precision for your scene (might be the case in large scenes)
     * You can try switching to logarithmic depth.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/logarithmicDepthBuffer
     */
    get useLogarithmicDepth() {
        return this._useLogarithmicDepth;
    }
    set useLogarithmicDepth(value) {
        const fragmentDepthSupported = !!this._scene?.getEngine().getCaps().fragmentDepthSupported;
        if (value && !fragmentDepthSupported) {
            Logger.Warn("Logarithmic depth has been requested for a sprite renderer on a device that doesn't support it.");
        }
        this._useLogarithmicDepth = value && fragmentDepthSupported;
        this._createEffects();
    }
    /**
     * Gets the capacity of the manager
     */
    get capacity() {
        return this._capacity;
    }
    /**
     * Gets or sets a boolean indicating if the renderer must render sprites with pixel perfect rendering
     * Note that pixel perfect mode is not supported in WebGL 1
     */
    get pixelPerfect() {
        return this._pixelPerfect;
    }
    set pixelPerfect(value) {
        if (this._pixelPerfect === value) {
            return;
        }
        this._pixelPerfect = value;
        this._createEffects();
    }
    /**
     * Gets the shader language used in this renderer.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Creates a new sprite renderer
     * @param engine defines the engine the renderer works with
     * @param capacity defines the maximum allowed number of sprites
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param scene defines the hosting scene
     * @param rendererOptions options for the sprite renderer
     */
    constructor(engine, capacity, epsilon = 0.01, scene = null, rendererOptions) {
        /**
         * Blend mode use to render the particle, it can be any of
         * the static undefined properties provided in this class.
         * Default value is 2
         */
        this.blendMode = 2;
        /**
         * Gets or sets a boolean indicating if alpha mode is automatically
         * reset.
         */
        this.autoResetAlpha = true;
        /**
         * Disables writing to the depth buffer when rendering the sprites.
         * It can be handy to disable depth writing when using textures without alpha channel
         * and setting some specific blend modes.
         */
        this.disableDepthWrite = false;
        this._fogEnabled = true;
        this._pixelPerfect = false;
        /** Shader language used by the material */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._useVAO = false;
        this._useInstancing = false;
        this._vertexBuffers = {};
        this._isDisposed = false;
        this._shadersLoaded = false;
        this._pixelPerfect = rendererOptions?.pixelPerfect ?? false;
        this._capacity = capacity;
        this._epsilon = epsilon;
        this._engine = engine;
        this._useInstancing = engine.getCaps().instancedArrays && engine._features.supportSpriteInstancing;
        this._useVAO = engine.getCaps().vertexArrayObject && !engine.disableVertexArrayObjects;
        this._scene = scene;
        if (!this._useInstancing) {
            this._buildIndexBuffer();
        }
        // VBO
        // 18 floats per sprite (x, y, z, angle, sizeX, sizeY, offsetX, offsetY, invertU, invertV, cellLeft, cellTop, cellWidth, cellHeight, color r, color g, color b, color a)
        // 16 when using instances
        this._vertexBufferSize = this._useInstancing ? 16 : 18;
        this._vertexData = new Float32Array(capacity * this._vertexBufferSize * (this._useInstancing ? 1 : 4));
        this._buffer = new Buffer(engine, this._vertexData, true, this._vertexBufferSize);
        const positions = this._buffer.createVertexBuffer(VertexBuffer.PositionKind, 0, 4, this._vertexBufferSize, this._useInstancing);
        const options = this._buffer.createVertexBuffer("options", 4, 2, this._vertexBufferSize, this._useInstancing);
        let offset = 6;
        let offsets;
        if (this._useInstancing) {
            const spriteData = new Float32Array([
                this._epsilon,
                this._epsilon,
                1 - this._epsilon,
                this._epsilon,
                this._epsilon,
                1 - this._epsilon,
                1 - this._epsilon,
                1 - this._epsilon,
            ]);
            this._spriteBuffer = new Buffer(engine, spriteData, false, 2);
            offsets = this._spriteBuffer.createVertexBuffer("offsets", 0, 2);
        }
        else {
            offsets = this._buffer.createVertexBuffer("offsets", offset, 2, this._vertexBufferSize, this._useInstancing);
            offset += 2;
        }
        const inverts = this._buffer.createVertexBuffer("inverts", offset, 2, this._vertexBufferSize, this._useInstancing);
        const cellInfo = this._buffer.createVertexBuffer("cellInfo", offset + 2, 4, this._vertexBufferSize, this._useInstancing);
        const colors = this._buffer.createVertexBuffer(VertexBuffer.ColorKind, offset + 6, 4, this._vertexBufferSize, this._useInstancing);
        this._vertexBuffers[VertexBuffer.PositionKind] = positions;
        this._vertexBuffers["options"] = options;
        this._vertexBuffers["offsets"] = offsets;
        this._vertexBuffers["inverts"] = inverts;
        this._vertexBuffers["cellInfo"] = cellInfo;
        this._vertexBuffers[VertexBuffer.ColorKind] = colors;
        this._initShaderSourceAsync();
    }
    async _initShaderSourceAsync() {
        const engine = this._engine;
        if (engine.isWebGPU && !SpriteRenderer.ForceGLSL) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
            await Promise.all([import("../ShadersWGSL/sprites.vertex.js"), import("../ShadersWGSL/sprites.fragment.js")]);
        }
        else {
            await Promise.all([import("../Shaders/sprites.vertex.js"), import("../Shaders/sprites.fragment.js")]);
        }
        this._shadersLoaded = true;
        this._createEffects();
    }
    _createEffects() {
        if (this._isDisposed || !this._shadersLoaded) {
            return;
        }
        this._drawWrapperBase?.dispose();
        this._drawWrapperDepth?.dispose();
        this._drawWrapperBase = new DrawWrapper(this._engine);
        this._drawWrapperDepth = new DrawWrapper(this._engine, false);
        if (this._drawWrapperBase.drawContext) {
            this._drawWrapperBase.drawContext.useInstancing = this._useInstancing;
        }
        if (this._drawWrapperDepth.drawContext) {
            this._drawWrapperDepth.drawContext.useInstancing = this._useInstancing;
        }
        let defines = "";
        if (this._pixelPerfect) {
            defines += "#define PIXEL_PERFECT\n";
        }
        if (this._scene && this._scene.fogEnabled && this._scene.fogMode !== 0 && this._fogEnabled) {
            defines += "#define FOG\n";
        }
        if (this._useLogarithmicDepth) {
            defines += "#define LOGARITHMICDEPTH\n";
        }
        this._drawWrapperBase.effect = this._engine.createEffect("sprites", [VertexBuffer.PositionKind, "options", "offsets", "inverts", "cellInfo", VertexBuffer.ColorKind], ["view", "projection", "textureInfos", "alphaTest", "vFogInfos", "vFogColor", "logarithmicDepthConstant"], ["diffuseSampler"], defines, undefined, undefined, undefined, undefined, this._shaderLanguage);
        this._drawWrapperDepth.effect = this._drawWrapperBase.effect;
        this._drawWrapperDepth.materialContext = this._drawWrapperBase.materialContext;
    }
    /**
     * Render all child sprites
     * @param sprites defines the list of sprites to render
     * @param deltaTime defines the time since last frame
     * @param viewMatrix defines the viewMatrix to use to render the sprites
     * @param projectionMatrix defines the projectionMatrix to use to render the sprites
     * @param customSpriteUpdate defines a custom function to update the sprites data before they render
     */
    render(sprites, deltaTime, viewMatrix, projectionMatrix, customSpriteUpdate = null) {
        if (!this._shadersLoaded || !this.texture || !this.texture.isReady() || !sprites.length) {
            return;
        }
        const drawWrapper = this._drawWrapperBase;
        const drawWrapperDepth = this._drawWrapperDepth;
        const shouldRenderFog = this.fogEnabled && this._scene && this._scene.fogEnabled && this._scene.fogMode !== 0;
        const effect = drawWrapper.effect;
        // Check
        if (!effect.isReady()) {
            return;
        }
        const engine = this._engine;
        const useRightHandedSystem = !!(this._scene && this._scene.useRightHandedSystem);
        // Sprites
        const max = Math.min(this._capacity, sprites.length);
        let offset = 0;
        let noSprite = true;
        for (let index = 0; index < max; index++) {
            const sprite = sprites[index];
            if (!sprite || !sprite.isVisible) {
                continue;
            }
            noSprite = false;
            sprite._animate(deltaTime);
            const baseSize = this.texture.getBaseSize(); // This could be change by the user inside the animate callback (like onAnimationEnd)
            this._appendSpriteVertex(offset++, sprite, 0, 0, baseSize, useRightHandedSystem, customSpriteUpdate);
            if (!this._useInstancing) {
                this._appendSpriteVertex(offset++, sprite, 1, 0, baseSize, useRightHandedSystem, customSpriteUpdate);
                this._appendSpriteVertex(offset++, sprite, 1, 1, baseSize, useRightHandedSystem, customSpriteUpdate);
                this._appendSpriteVertex(offset++, sprite, 0, 1, baseSize, useRightHandedSystem, customSpriteUpdate);
            }
        }
        if (noSprite) {
            return;
        }
        this._buffer.update(this._vertexData);
        const culling = !!engine.depthCullingState.cull;
        const zOffset = engine.depthCullingState.zOffset;
        const zOffsetUnits = engine.depthCullingState.zOffsetUnits;
        engine.setState(culling, zOffset, false, false, undefined, undefined, zOffsetUnits);
        // Render
        engine.enableEffect(drawWrapper);
        effect.setTexture("diffuseSampler", this.texture);
        effect.setMatrix("view", viewMatrix);
        effect.setMatrix("projection", projectionMatrix);
        // Scene Info
        if (shouldRenderFog) {
            const scene = this._scene;
            // Fog
            effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
            effect.setColor3("vFogColor", scene.fogColor);
        }
        // Log. depth
        if (this.useLogarithmicDepth && this._scene) {
            BindLogDepth(drawWrapper.defines, effect, this._scene);
        }
        if (this._useVAO) {
            if (!this._vertexArrayObject) {
                this._vertexArrayObject = engine.recordVertexArrayObject(this._vertexBuffers, this._indexBuffer, effect);
            }
            engine.bindVertexArrayObject(this._vertexArrayObject, this._indexBuffer);
        }
        else {
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
        }
        // Draw order
        engine.depthCullingState.depthFunc = engine.useReverseDepthBuffer ? 518 : 515;
        if (!this.disableDepthWrite) {
            effect.setBool("alphaTest", true);
            engine.setColorWrite(false);
            engine.enableEffect(drawWrapperDepth);
            if (this._useInstancing) {
                engine.drawArraysType(7, 0, 4, offset);
            }
            else {
                engine.drawElementsType(0, 0, (offset / 4) * 6);
            }
            engine.enableEffect(drawWrapper);
            engine.setColorWrite(true);
            effect.setBool("alphaTest", false);
        }
        engine.setAlphaMode(this.blendMode);
        if (this._useInstancing) {
            engine.drawArraysType(7, 0, 4, offset);
        }
        else {
            engine.drawElementsType(0, 0, (offset / 4) * 6);
        }
        if (this.autoResetAlpha) {
            engine.setAlphaMode(0);
        }
        // Restore Right Handed
        if (useRightHandedSystem) {
            this._scene.getEngine().setState(culling, zOffset, false, true, undefined, undefined, zOffsetUnits);
        }
        engine.unbindInstanceAttributes();
    }
    _appendSpriteVertex(index, sprite, offsetX, offsetY, baseSize, useRightHandedSystem, customSpriteUpdate) {
        let arrayOffset = index * this._vertexBufferSize;
        if (offsetX === 0) {
            offsetX = this._epsilon;
        }
        else if (offsetX === 1) {
            offsetX = 1 - this._epsilon;
        }
        if (offsetY === 0) {
            offsetY = this._epsilon;
        }
        else if (offsetY === 1) {
            offsetY = 1 - this._epsilon;
        }
        if (customSpriteUpdate) {
            customSpriteUpdate(sprite, baseSize);
        }
        else {
            if (!sprite.cellIndex) {
                sprite.cellIndex = 0;
            }
            const rowSize = baseSize.width / this.cellWidth;
            const offset = (sprite.cellIndex / rowSize) >> 0;
            sprite._xOffset = ((sprite.cellIndex - offset * rowSize) * this.cellWidth) / baseSize.width;
            sprite._yOffset = (offset * this.cellHeight) / baseSize.height;
            sprite._xSize = this.cellWidth;
            sprite._ySize = this.cellHeight;
        }
        // Positions
        this._vertexData[arrayOffset] = sprite.position.x;
        this._vertexData[arrayOffset + 1] = sprite.position.y;
        this._vertexData[arrayOffset + 2] = sprite.position.z;
        this._vertexData[arrayOffset + 3] = sprite.angle;
        // Options
        this._vertexData[arrayOffset + 4] = sprite.width;
        this._vertexData[arrayOffset + 5] = sprite.height;
        if (!this._useInstancing) {
            this._vertexData[arrayOffset + 6] = offsetX;
            this._vertexData[arrayOffset + 7] = offsetY;
        }
        else {
            arrayOffset -= 2;
        }
        // Inverts according to Right Handed
        if (useRightHandedSystem) {
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 0 : 1;
        }
        else {
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 1 : 0;
        }
        this._vertexData[arrayOffset + 9] = sprite.invertV ? 1 : 0;
        this._vertexData[arrayOffset + 10] = sprite._xOffset;
        this._vertexData[arrayOffset + 11] = sprite._yOffset;
        this._vertexData[arrayOffset + 12] = sprite._xSize / baseSize.width;
        this._vertexData[arrayOffset + 13] = sprite._ySize / baseSize.height;
        // Color
        this._vertexData[arrayOffset + 14] = sprite.color.r;
        this._vertexData[arrayOffset + 15] = sprite.color.g;
        this._vertexData[arrayOffset + 16] = sprite.color.b;
        this._vertexData[arrayOffset + 17] = sprite.color.a;
    }
    _buildIndexBuffer() {
        const indices = [];
        let index = 0;
        for (let count = 0; count < this._capacity; count++) {
            indices.push(index);
            indices.push(index + 1);
            indices.push(index + 2);
            indices.push(index);
            indices.push(index + 2);
            indices.push(index + 3);
            index += 4;
        }
        this._indexBuffer = this._engine.createIndexBuffer(indices);
    }
    /**
     * Rebuilds the renderer (after a context lost, for eg)
     */
    rebuild() {
        if (this._indexBuffer) {
            this._buildIndexBuffer();
        }
        if (this._useVAO) {
            this._vertexArrayObject = undefined;
        }
        this._buffer._rebuild();
        for (const key in this._vertexBuffers) {
            const vertexBuffer = this._vertexBuffers[key];
            vertexBuffer._rebuild();
        }
        this._spriteBuffer?._rebuild();
    }
    /**
     * Release associated resources
     */
    dispose() {
        if (this._buffer) {
            this._buffer.dispose();
            this._buffer = null;
        }
        if (this._spriteBuffer) {
            this._spriteBuffer.dispose();
            this._spriteBuffer = null;
        }
        if (this._indexBuffer) {
            this._engine._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
        if (this._vertexArrayObject) {
            this._engine.releaseVertexArrayObject(this._vertexArrayObject);
            this._vertexArrayObject = null;
        }
        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }
        this._drawWrapperBase?.dispose();
        this._drawWrapperDepth?.dispose();
        this._isDisposed = true;
    }
}
/**
 * Force all the sprites to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
SpriteRenderer.ForceGLSL = false;
//# sourceMappingURL=spriteRenderer.js.map