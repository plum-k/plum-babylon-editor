
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
import { ShaderMaterial } from "../Materials/shaderMaterial.js";
import { Color3, Color4 } from "../Maths/math.color.js";
import { VertexBuffer } from "../Meshes/buffer.js";
/**
 * Class used to perform a picking operation using GPU
 * GPUPIcker can pick meshes, instances and thin instances
 */
export class GPUPicker {
    constructor() {
        this._pickingTexture = null;
        this._idMap = [];
        this._thinIdMap = [];
        this._idColors = [];
        this._meshMaterialMap = new Map();
        this._meshRenderingCount = 0;
        this._attributeName = "instanceMeshID";
        /** Shader language used by the generator */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._pickingInProgress = false;
    }
    /**
     * Gets the shader language used in this generator.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Gets a boolean indicating if the picking is in progress
     */
    get pickingInProgress() {
        return this._pickingInProgress;
    }
    static _IdToRgb(id) {
        GPUPicker._TempColor.r = (id & 0xff0000) >> 16;
        GPUPicker._TempColor.g = (id & 0x00ff00) >> 8;
        GPUPicker._TempColor.b = (id & 0x0000ff) >> 0;
    }
    _getColorIdFromReadBuffer(offset) {
        const r = this._readbuffer[offset];
        const g = this._readbuffer[offset + 1];
        const b = this._readbuffer[offset + 2];
        return (r << 16) + (g << 8) + b;
    }
    static _SetColorData(buffer, i, r, g, b) {
        buffer[i] = r / 255.0;
        buffer[i + 1] = g / 255.0;
        buffer[i + 2] = b / 255.0;
        buffer[i + 3] = 1.0;
    }
    _createRenderTarget(scene, width, height) {
        if (this._pickingTexture) {
            this._pickingTexture.dispose();
        }
        this._pickingTexture = new RenderTargetTexture("pickingTexure", { width: width, height: height }, scene, false, undefined, 0, false, 1);
    }
    async _createColorMaterialAsync(scene) {
        if (this._defaultRenderMaterial) {
            this._defaultRenderMaterial.dispose();
        }
        this._defaultRenderMaterial = null;
        const engine = scene.getEngine();
        if (engine.isWebGPU) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
        const defines = [];
        const options = {
            attributes: [VertexBuffer.PositionKind, this._attributeName, "bakedVertexAnimationSettingsInstanced"],
            uniforms: ["world", "viewProjection", "meshID"],
            needAlphaBlending: false,
            defines: defines,
            useClipPlane: null,
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await Promise.all([import("../ShadersWGSL/picking.fragment.js"), import("../ShadersWGSL/picking.vertex.js")]);
                }
                else {
                    await Promise.all([import("../Shaders/picking.fragment.js"), import("../Shaders/picking.vertex.js")]);
                }
            },
        };
        this._defaultRenderMaterial = new ShaderMaterial("pickingShader", scene, "picking", options, false);
        this._defaultRenderMaterial.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
    }
    _materialBindCallback(mesh) {
        if (!mesh) {
            return;
        }
        const material = this._meshMaterialMap.get(mesh);
        const effect = material.getEffect();
        if (!mesh.hasInstances && !mesh.isAnInstance && !mesh.hasThinInstances) {
            effect.setColor4("meshID", this._idColors[mesh.uniqueId], 1);
        }
        this._meshRenderingCount++;
    }
    _generateColorData(instanceCount, id, index, r, g, b, onInstance) {
        const colorData = new Float32Array(4 * (instanceCount + 1));
        GPUPicker._SetColorData(colorData, 0, r, g, b);
        for (let i = 0; i < instanceCount; i++) {
            GPUPicker._IdToRgb(id);
            onInstance(i, id);
            GPUPicker._SetColorData(colorData, (i + 1) * 4, GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b);
            id++;
        }
        return colorData;
    }
    _generateThinInstanceColorData(instanceCount, id, onInstance) {
        const colorData = new Float32Array(4 * instanceCount);
        for (let i = 0; i < instanceCount; i++) {
            GPUPicker._IdToRgb(id);
            onInstance(i, id);
            GPUPicker._SetColorData(colorData, i * 4, GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b);
            id++;
        }
        return colorData;
    }
    /**
     * Set the list of meshes to pick from
     * Set that value to null to clear the list (and avoid leaks)
     * The module will read and delete from the array provided by reference. Disposing the module or setting the value to null will clear the array.
     * @param list defines the list of meshes to pick from
     */
    setPickingList(list) {
        if (this._pickableMeshes) {
            // Cleanup
            for (let index = 0; index < this._pickableMeshes.length; index++) {
                const mesh = this._pickableMeshes[index];
                if (mesh.hasInstances) {
                    mesh.removeVerticesData(this._attributeName);
                }
                if (mesh.hasThinInstances) {
                    mesh.thinInstanceSetBuffer(this._attributeName, null);
                }
                if (this._pickingTexture) {
                    this._pickingTexture.setMaterialForRendering(mesh, undefined);
                }
                const material = this._meshMaterialMap.get(mesh);
                if (material !== this._defaultRenderMaterial) {
                    material.onBindObservable.removeCallback(this._materialBindCallback);
                }
            }
            this._pickableMeshes.length = 0;
            this._meshMaterialMap.clear();
            this._idMap.length = 0;
            this._thinIdMap.length = 0;
            this._idColors.length = 0;
            if (this._pickingTexture) {
                this._pickingTexture.renderList = [];
            }
        }
        if (!list || list.length === 0) {
            return;
        }
        this._pickableMeshes = list;
        // Prepare target
        const scene = ("mesh" in list[0] ? list[0].mesh : list[0]).getScene();
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        if (!this._pickingTexture) {
            this._createRenderTarget(scene, rttSizeW, rttSizeH);
        }
        else {
            const size = this._pickingTexture.getSize();
            if (size.width !== rttSizeW || size.height !== rttSizeH || this._cachedScene !== scene) {
                this._createRenderTarget(scene, rttSizeW, rttSizeH);
            }
        }
        if (!this._cachedScene || this._cachedScene !== scene) {
            this._createColorMaterialAsync(scene);
        }
        this._cachedScene = scene;
        this._engine = scene.getEngine();
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if ("mesh" in item) {
                this._meshMaterialMap.set(item.mesh, item.material);
                list[i] = item.mesh;
            }
            else {
                this._meshMaterialMap.set(item, this._defaultRenderMaterial);
            }
        }
        this._pickingTexture.renderList = [];
        // We will affect colors and create vertex color buffers
        let id = 1;
        for (let index = 0; index < this._pickableMeshes.length; index++) {
            const mesh = this._pickableMeshes[index];
            const material = this._meshMaterialMap.get(mesh);
            if (material !== this._defaultRenderMaterial) {
                material.onBindObservable.add(this._materialBindCallback, undefined, undefined, this);
            }
            this._pickingTexture.setMaterialForRendering(mesh, material);
            this._pickingTexture.renderList.push(mesh);
            if (mesh.isAnInstance) {
                continue; // This will be handled by the source mesh
            }
            GPUPicker._IdToRgb(id);
            if (mesh.hasThinInstances) {
                const colorData = this._generateThinInstanceColorData(mesh.thinInstanceCount, id, (i, id) => {
                    this._thinIdMap[id] = { meshId: index, thinId: i };
                });
                id += mesh.thinInstanceCount;
                mesh.thinInstanceSetBuffer(this._attributeName, colorData, 4);
            }
            else {
                this._idMap[id] = index;
                id++;
                if (mesh.hasInstances) {
                    const instances = mesh.instances;
                    const colorData = this._generateColorData(instances.length, id, index, GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b, (i, id) => {
                        const instance = instances[i];
                        this._idMap[id] = this._pickableMeshes.indexOf(instance);
                    });
                    id += instances.length;
                    const engine = mesh.getEngine();
                    const buffer = new VertexBuffer(engine, colorData, this._attributeName, false, false, 4, true);
                    mesh.setVerticesBuffer(buffer, true);
                }
                else {
                    this._idColors[mesh.uniqueId] = Color3.FromInts(GPUPicker._TempColor.r, GPUPicker._TempColor.g, GPUPicker._TempColor.b);
                }
            }
        }
    }
    /**
     * Execute a picking operation
     * @param x defines the X coordinates where to run the pick
     * @param y defines the Y coordinates where to run the pick
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive (false by default)
     * @returns A promise with the picking results
     */
    async pickAsync(x, y, disposeWhenDone = false) {
        if (this._pickingInProgress) {
            return null;
        }
        if (!this._pickableMeshes || this._pickableMeshes.length === 0) {
            return null;
        }
        const { x: adjustedX, y: adjustedY, rttSizeW, rttSizeH } = this._prepareForPicking(x, y);
        if (adjustedX < 0 || adjustedY < 0 || adjustedX >= rttSizeW || adjustedY >= rttSizeH) {
            return null;
        }
        this._pickingInProgress = true;
        // Invert Y
        const invertedY = rttSizeH - adjustedY - 1;
        this._preparePickingBuffer(this._engine, rttSizeW, rttSizeH, adjustedX, invertedY);
        return this._executePicking(adjustedX, invertedY, disposeWhenDone);
    }
    /**
     * Execute a picking operation on multiple coordinates
     * @param xy defines the X,Y coordinates where to run the pick
     * @param disposeWhenDone defines a boolean indicating we do not want to keep resources alive (false by default)
     * @returns A promise with the picking results. Always returns an array with the same length as the number of coordinates. The mesh or null at the index where no mesh was picked.
     */
    async multiPickAsync(xy, disposeWhenDone = false) {
        if (this._pickingInProgress) {
            return null;
        }
        if (!this._pickableMeshes || this._pickableMeshes.length === 0 || xy.length === 0) {
            return null;
        }
        if (xy.length === 1) {
            const pi = await this.pickAsync(xy[0].x, xy[0].y, disposeWhenDone);
            return {
                meshes: [pi?.mesh ?? null],
                thinInstanceIndexes: pi?.thinInstanceIndex ? [pi.thinInstanceIndex] : undefined,
            };
        }
        this._pickingInProgress = true;
        let minX = xy[0].x, maxX = xy[0].x, minY = xy[0].y, maxY = xy[0].y;
        for (let i = 1; i < xy.length; i++) {
            const { x, y } = xy[i];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        const { rttSizeW, rttSizeH } = this._prepareForPicking(minX, minY);
        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);
        const partialCutH = rttSizeH - maxY - 1;
        this._preparePickingBuffer(this._engine, rttSizeW, rttSizeH, minX, partialCutH, w, h);
        return this._executeMultiPicking(xy, minX, maxY, rttSizeH, w, h, disposeWhenDone);
    }
    _prepareForPicking(x, y) {
        const scene = this._cachedScene;
        const engine = scene.getEngine();
        const rttSizeW = engine.getRenderWidth();
        const rttSizeH = engine.getRenderHeight();
        const devicePixelRatio = 1 / engine._hardwareScalingLevel;
        const intX = (devicePixelRatio * x) >> 0;
        const intY = (devicePixelRatio * y) >> 0;
        return { x: intX, y: intY, rttSizeW, rttSizeH };
    }
    _preparePickingBuffer(engine, rttSizeW, rttSizeH, x, y, w = 1, h = 1) {
        this._meshRenderingCount = 0;
        const requiredBufferSize = engine.isWebGPU ? (4 * w * h + 255) & ~255 : 4 * w * h;
        if (!this._readbuffer || this._readbuffer.length < requiredBufferSize) {
            this._readbuffer = new Uint8Array(requiredBufferSize);
        }
        // Do we need to rebuild the RTT?
        const size = this._pickingTexture.getSize();
        if (size.width !== rttSizeW || size.height !== rttSizeH) {
            this._createRenderTarget(this._cachedScene, rttSizeW, rttSizeH);
            this._updateRenderList();
        }
        this._pickingTexture.clearColor = new Color4(0, 0, 0, 0);
        this._pickingTexture.onBeforeRender = () => {
            this._enableScissor(x, y, w, h);
        };
        this._cachedScene.customRenderTargets.push(this._pickingTexture);
    }
    // pick one pixel
    _executePicking(x, y, disposeWhenDone) {
        return new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject();
                return;
            }
            this._pickingTexture.onAfterRender = async () => {
                this._disableScissor();
                if (this._checkRenderStatus()) {
                    this._pickingTexture.onAfterRender = null;
                    let pickedMesh = null;
                    let thinInstanceIndex = undefined;
                    // Remove from the active RTTs
                    const index = this._cachedScene.customRenderTargets.indexOf(this._pickingTexture);
                    if (index > -1) {
                        this._cachedScene.customRenderTargets.splice(index, 1);
                    }
                    // Do the actual picking
                    if (await this._readTexturePixelsAsync(x, y)) {
                        const colorId = this._getColorIdFromReadBuffer(0);
                        // Thin?
                        if (this._thinIdMap[colorId]) {
                            pickedMesh = this._pickableMeshes[this._thinIdMap[colorId].meshId];
                            thinInstanceIndex = this._thinIdMap[colorId].thinId;
                        }
                        else {
                            pickedMesh = this._pickableMeshes[this._idMap[colorId]];
                        }
                    }
                    if (disposeWhenDone) {
                        this.dispose();
                    }
                    this._pickingInProgress = false;
                    if (pickedMesh) {
                        resolve({ mesh: pickedMesh, thinInstanceIndex: thinInstanceIndex });
                    }
                    else {
                        resolve(null);
                    }
                }
            };
        });
    }
    // pick multiple pixels
    _executeMultiPicking(xy, minX, maxY, rttSizeH, w, h, disposeWhenDone) {
        return new Promise((resolve, reject) => {
            if (!this._pickingTexture) {
                this._pickingInProgress = false;
                reject();
                return;
            }
            this._pickingTexture.onAfterRender = async () => {
                this._disableScissor();
                if (this._checkRenderStatus()) {
                    this._pickingTexture.onAfterRender = null;
                    const pickedMeshes = [];
                    const thinInstanceIndexes = [];
                    if (await this._readTexturePixelsAsync(minX, rttSizeH - maxY - 1, w, h)) {
                        for (let i = 0; i < xy.length; i++) {
                            const { pickedMesh, thinInstanceIndex } = this._getMeshFromMultiplePoints(xy[i].x, xy[i].y, minX, maxY, w);
                            pickedMeshes.push(pickedMesh);
                            thinInstanceIndexes.push(thinInstanceIndex ?? 0);
                        }
                    }
                    if (disposeWhenDone) {
                        this.dispose();
                    }
                    this._pickingInProgress = false;
                    resolve({ meshes: pickedMeshes, thinInstanceIndexes: thinInstanceIndexes });
                }
            };
        });
    }
    _enableScissor(x, y, w = 1, h = 1) {
        if (this._engine.enableScissor) {
            this._engine.enableScissor(x, y, w, h);
        }
    }
    _disableScissor() {
        if (this._engine.disableScissor) {
            this._engine.disableScissor();
        }
    }
    /**
     * @returns true if rendering if the picking texture has finished, otherwise false
     */
    _checkRenderStatus() {
        const wasSuccessfull = this._meshRenderingCount > 0;
        if (wasSuccessfull) {
            // Remove from the active RTTs
            const index = this._cachedScene.customRenderTargets.indexOf(this._pickingTexture);
            if (index > -1) {
                this._cachedScene.customRenderTargets.splice(index, 1);
            }
            return true;
        }
        this._meshRenderingCount = 0;
        return false; // Wait for shaders to be ready
    }
    _getMeshFromMultiplePoints(x, y, minX, maxY, w) {
        let offsetX = (x - minX - 1) * 4;
        let offsetY = (maxY - y - 1) * w * 4;
        offsetX = Math.max(offsetX, 0);
        offsetY = Math.max(offsetY, 0);
        const colorId = this._getColorIdFromReadBuffer(offsetX + offsetY);
        let pickedMesh = null;
        let thinInstanceIndex;
        if (colorId > 0) {
            if (this._thinIdMap[colorId]) {
                pickedMesh = this._pickableMeshes[this._thinIdMap[colorId].meshId];
                thinInstanceIndex = this._thinIdMap[colorId].thinId;
            }
            else {
                pickedMesh = this._pickableMeshes[this._idMap[colorId]];
            }
        }
        return { pickedMesh, thinInstanceIndex };
    }
    /**
     * Updates the render list with the current pickable meshes.
     */
    _updateRenderList() {
        this._pickingTexture.renderList = [];
        for (const mesh of this._pickableMeshes) {
            this._pickingTexture.setMaterialForRendering(mesh, this._meshMaterialMap.get(mesh));
            this._pickingTexture.renderList.push(mesh);
        }
    }
    async _readTexturePixelsAsync(x, y, w = 1, h = 1) {
        if (!this._cachedScene || !this._pickingTexture?._texture) {
            return false;
        }
        const engine = this._cachedScene.getEngine();
        await engine._readTexturePixels(this._pickingTexture._texture, w, h, -1, 0, this._readbuffer, true, true, x, y);
        return true;
    }
    /** Release the resources */
    dispose() {
        this.setPickingList(null);
        this._cachedScene = null;
        // Cleaning up
        this._pickingTexture?.dispose();
        this._pickingTexture = null;
        this._defaultRenderMaterial?.dispose();
        this._defaultRenderMaterial = null;
    }
}
GPUPicker._TempColor = {
    r: 0,
    g: 0,
    b: 0,
};
//# sourceMappingURL=gpuPicker.js.map