import { VertexBuffer } from "../../../Buffers/buffer.js";
import { Texture } from "../texture.js";
import { DynamicTexture } from "../dynamicTexture.js";
import { Vector2 } from "../../../Maths/math.vector.js";
import { Color3, Color4 } from "../../../Maths/math.color.js";
import { TexturePackerFrame } from "./frame.js";
import { Logger } from "../../../Misc/logger.js";
import { Tools } from "../../../Misc/tools.js";

/**
 * This is a support class that generates a series of packed texture sets.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
 */
export class TexturePacker {
    /**
     * Initializes a texture package series from an array of meshes or a single mesh.
     * @param name The name of the package
     * @param meshes The target meshes to compose the package from
     * @param options The arguments that texture packer should follow while building.
     * @param scene The scene which the textures are scoped to.
     * @returns TexturePacker
     */
    constructor(name, meshes, options, scene) {
        this.name = name;
        this.meshes = meshes;
        this.scene = scene;
        /**
         * Run through the options and set what ever defaults are needed that where not declared.
         */
        this.options = options;
        this.options.map = this.options.map ?? [
            "ambientTexture",
            "bumpTexture",
            "diffuseTexture",
            "emissiveTexture",
            "lightmapTexture",
            "opacityTexture",
            "reflectionTexture",
            "refractionTexture",
            "specularTexture",
        ];
        this.options.uvsIn = this.options.uvsIn ?? VertexBuffer.UVKind;
        this.options.uvsOut = this.options.uvsOut ?? VertexBuffer.UVKind;
        this.options.layout = this.options.layout ?? TexturePacker.LAYOUT_STRIP;
        if (this.options.layout === TexturePacker.LAYOUT_COLNUM) {
            this.options.colnum = this.options.colnum ?? 8;
        }
        this.options.updateInputMeshes = this.options.updateInputMeshes ?? true;
        this.options.disposeSources = this.options.disposeSources ?? true;
        this._expecting = 0;
        this.options.fillBlanks = this.options.fillBlanks ?? true;
        if (this.options.fillBlanks === true) {
            this.options.customFillColor = this.options.customFillColor ?? "black";
        }
        this.options.frameSize = this.options.frameSize ?? 256;
        this.options.paddingRatio = this.options.paddingRatio ?? 0.0115;
        this._paddingValue = Math.ceil(this.options.frameSize * this.options.paddingRatio);
        //Make it an even padding Number.
        if (this._paddingValue % 2 !== 0) {
            this._paddingValue++;
        }
        this.options.paddingMode = this.options.paddingMode ?? TexturePacker.SUBUV_WRAP;
        if (this.options.paddingMode === TexturePacker.SUBUV_COLOR) {
            this.options.paddingColor = this.options.paddingColor ?? new Color4(0, 0, 0, 1.0);
        }
        this.sets = {};
        this.frames = [];
        return this;
    }
    /**
     * Starts the package process
     * @param resolve The promises resolution function
     */
    _createFrames(resolve) {
        const dtSize = this._calculateSize();
        const dtUnits = new Vector2(1, 1).divide(dtSize);
        let doneCount = 0;
        const expecting = this._expecting;
        const meshLength = this.meshes.length;
        const sKeys = Object.keys(this.sets);
        for (let i = 0; i < sKeys.length; i++) {
            const setName = sKeys[i];
            const dt = new DynamicTexture(this.name + ".TexturePack." + setName + "Set", { width: dtSize.x, height: dtSize.y }, this.scene, true, //Generate Mips
            Texture.TRILINEAR_SAMPLINGMODE, 5);
            const dtx = dt.getContext();
            dtx.fillStyle = "rgba(0,0,0,0)";
            dtx.fillRect(0, 0, dtSize.x, dtSize.y);
            dt.update(false);
            this.sets[setName] = dt;
        }
        const baseSize = this.options.frameSize || 256;
        const padding = this._paddingValue;
        const tcs = baseSize + 2 * padding;
        const done = () => {
            this._calculateMeshUVFrames(baseSize, padding, dtSize, dtUnits, this.options.updateInputMeshes || false);
        };
        //Update the Textures
        for (let i = 0; i < meshLength; i++) {
            const m = this.meshes[i];
            const mat = m.material;
            //Check if the material has the texture
            //Create a temporary canvas the same size as 1 frame
            //Then apply the texture to the center and the 8 offsets
            //Copy the Context and place in the correct frame on the DT
            for (let j = 0; j < sKeys.length; j++) {
                const tempTexture = new DynamicTexture("temp", tcs, this.scene, true);
                const tcx = tempTexture.getContext();
                const offset = this._getFrameOffset(i);
                const updateDt = () => {
                    doneCount++;
                    tempTexture.update(false);
                    const iDat = tcx.getImageData(0, 0, tcs, tcs);
                    //Update Set
                    const dt = this.sets[setName];
                    const dtx = dt.getContext();
                    dtx.putImageData(iDat, dtSize.x * offset.x, dtSize.y * offset.y);
                    tempTexture.dispose();
                    dt.update(false);
                    if (doneCount == expecting) {
                        done();
                        resolve();
                        return;
                    }
                };
                const setName = sKeys[j] || "_blank";
                if (!mat || mat[setName] === null) {
                    tcx.fillStyle = "rgba(0,0,0,0)";
                    if (this.options.fillBlanks) {
                        tcx.fillStyle = this.options.customFillColor;
                    }
                    tcx.fillRect(0, 0, tcs, tcs);
                    updateDt();
                }
                else {
                    const setTexture = mat[setName];
                    const img = new Image();
                    if (setTexture instanceof DynamicTexture) {
                        img.src = setTexture.getContext().canvas.toDataURL("image/png");
                    }
                    else {
                        img.src = setTexture.url;
                    }
                    Tools.SetCorsBehavior(img.src, img);
                    img.onload = () => {
                        tcx.fillStyle = "rgba(0,0,0,0)";
                        tcx.fillRect(0, 0, tcs, tcs);
                        tempTexture.update(false);
                        tcx.setTransform(1, 0, 0, -1, 0, 0);
                        const cellOffsets = [0, 0, 1, 0, 1, 1, 0, 1, -1, 1, -1, 0, -1 - 1, 0, -1, 1, -1];
                        switch (this.options.paddingMode) {
                            //Wrap Mode
                            case 0:
                                for (let i = 0; i < 9; i++) {
                                    tcx.drawImage(img, 0, 0, img.width, img.height, padding + baseSize * cellOffsets[i], padding + baseSize * cellOffsets[i + 1] - tcs, baseSize, baseSize);
                                }
                                break;
                            //Extend Mode
                            case 1:
                                for (let i = 0; i < padding; i++) {
                                    tcx.drawImage(img, 0, 0, img.width, img.height, i + baseSize * cellOffsets[0], padding - tcs, baseSize, baseSize);
                                    tcx.drawImage(img, 0, 0, img.width, img.height, padding * 2 - i, padding - tcs, baseSize, baseSize);
                                    tcx.drawImage(img, 0, 0, img.width, img.height, padding, i - tcs, baseSize, baseSize);
                                    tcx.drawImage(img, 0, 0, img.width, img.height, padding, padding * 2 - i - tcs, baseSize, baseSize);
                                }
                                tcx.drawImage(img, 0, 0, img.width, img.height, padding + baseSize * cellOffsets[0], padding + baseSize * cellOffsets[1] - tcs, baseSize, baseSize);
                                break;
                            //Color Mode
                            case 2:
                                tcx.fillStyle = (this.options.paddingColor || Color3.Black()).toHexString();
                                tcx.fillRect(0, 0, tcs, -tcs);
                                tcx.clearRect(padding, padding, baseSize, baseSize);
                                tcx.drawImage(img, 0, 0, img.width, img.height, padding + baseSize * cellOffsets[0], padding + baseSize * cellOffsets[1] - tcs, baseSize, baseSize);
                                break;
                        }
                        tcx.setTransform(1, 0, 0, 1, 0, 0);
                        updateDt();
                    };
                }
            }
        }
    }
    /**
     * Calculates the Size of the Channel Sets
     * @returns Vector2
     */
    _calculateSize() {
        const meshLength = this.meshes.length || 0;
        const baseSize = this.options.frameSize || 0;
        const padding = this._paddingValue || 0;
        switch (this.options.layout) {
            case 0: {
                //STRIP_LAYOUT
                return new Vector2(baseSize * meshLength + 2 * padding * meshLength, baseSize + 2 * padding);
            }
            case 1: {
                //POWER2
                const sqrtCount = Math.max(2, Math.ceil(Math.sqrt(meshLength)));
                const size = baseSize * sqrtCount + 2 * padding * sqrtCount;
                return new Vector2(size, size);
            }
            case 2: {
                //COLNUM
                const cols = this.options.colnum || 1;
                const rowCnt = Math.max(1, Math.ceil(meshLength / cols));
                return new Vector2(baseSize * cols + 2 * padding * cols, baseSize * rowCnt + 2 * padding * rowCnt);
            }
        }
        return Vector2.Zero();
    }
    /**
     * Calculates the UV data for the frames.
     * @param baseSize the base frameSize
     * @param padding the base frame padding
     * @param dtSize size of the Dynamic Texture for that channel
     * @param dtUnits is 1/dtSize
     * @param update flag to update the input meshes
     */
    _calculateMeshUVFrames(baseSize, padding, dtSize, dtUnits, update) {
        const meshLength = this.meshes.length;
        for (let i = 0; i < meshLength; i++) {
            const m = this.meshes[i];
            const scale = new Vector2(baseSize / dtSize.x, baseSize / dtSize.y);
            const pOffset = dtUnits.clone().scale(padding);
            const frameOffset = this._getFrameOffset(i);
            const offset = frameOffset.add(pOffset);
            const frame = new TexturePackerFrame(i, scale, offset);
            this.frames.push(frame);
            //Update Output UVs
            if (update) {
                this._updateMeshUV(m, i);
                this._updateTextureReferences(m);
            }
        }
    }
    /**
     * Calculates the frames Offset.
     * @param index of the frame
     * @returns Vector2
     */
    _getFrameOffset(index) {
        const meshLength = this.meshes.length;
        let uvStep, yStep, xStep;
        switch (this.options.layout) {
            case 0: {
                //STRIP_LAYOUT
                uvStep = 1 / meshLength;
                return new Vector2(index * uvStep, 0);
            }
            case 1: {
                //POWER2
                const sqrtCount = Math.max(2, Math.ceil(Math.sqrt(meshLength)));
                yStep = Math.floor(index / sqrtCount);
                xStep = index - yStep * sqrtCount;
                uvStep = 1 / sqrtCount;
                return new Vector2(xStep * uvStep, yStep * uvStep);
            }
            case 2: {
                //COLNUM
                const cols = this.options.colnum || 1;
                const rowCnt = Math.max(1, Math.ceil(meshLength / cols));
                xStep = Math.floor(index / rowCnt);
                yStep = index - xStep * rowCnt;
                uvStep = new Vector2(1 / cols, 1 / rowCnt);
                return new Vector2(xStep * uvStep.x, yStep * uvStep.y);
            }
        }
        return Vector2.Zero();
    }
    /**
     * Updates a Mesh to the frame data
     * @param mesh that is the target
     * @param frameID or the frame index
     */
    _updateMeshUV(mesh, frameID) {
        const frame = this.frames[frameID];
        const uvIn = mesh.getVerticesData(this.options.uvsIn || VertexBuffer.UVKind);
        const uvOut = [];
        let toCount = 0;
        if (uvIn.length) {
            toCount = uvIn.length || 0;
        }
        for (let i = 0; i < toCount; i += 2) {
            uvOut.push(uvIn[i] * frame.scale.x + frame.offset.x, uvIn[i + 1] * frame.scale.y + frame.offset.y);
        }
        mesh.setVerticesData(this.options.uvsOut || VertexBuffer.UVKind, uvOut);
    }
    /**
     * Updates a Meshes materials to use the texture packer channels
     * @param m is the mesh to target
     * @param force all channels on the packer to be set.
     */
    _updateTextureReferences(m, force = false) {
        const mat = m.material;
        const sKeys = Object.keys(this.sets);
        const _dispose = (_t) => {
            if (_t.dispose) {
                _t.dispose();
            }
        };
        for (let i = 0; i < sKeys.length; i++) {
            const setName = sKeys[i];
            if (!force) {
                if (!mat) {
                    return;
                }
                if (mat[setName] !== null) {
                    _dispose(mat[setName]);
                    mat[setName] = this.sets[setName];
                }
            }
            else {
                if (mat[setName] !== null) {
                    _dispose(mat[setName]);
                }
                mat[setName] = this.sets[setName];
            }
        }
    }
    /**
     * Public method to set a Mesh to a frame
     * @param m that is the target
     * @param frameID or the frame index
     * @param updateMaterial trigger for if the Meshes attached Material be updated?
     */
    setMeshToFrame(m, frameID, updateMaterial = false) {
        this._updateMeshUV(m, frameID);
        if (updateMaterial) {
            this._updateTextureReferences(m, true);
        }
    }
    /**
     * Starts the async promise to compile the texture packer.
     * @returns Promise<void>
     */
    processAsync() {
        return new Promise((resolve, reject) => {
            try {
                if (this.meshes.length === 0) {
                    //Must be a JSON load!
                    resolve();
                    return;
                }
                let done = 0;
                const doneCheck = (mat) => {
                    done++;
                    //Check Status of all Textures on all meshes, till they are ready.
                    if (this.options.map) {
                        for (let j = 0; j < this.options.map.length; j++) {
                            const index = this.options.map[j];
                            const t = mat[index];
                            if (t !== null) {
                                if (!this.sets[this.options.map[j]]) {
                                    this.sets[this.options.map[j]] = true;
                                }
                                this._expecting++;
                            }
                        }
                        if (done === this.meshes.length) {
                            this._createFrames(resolve);
                        }
                    }
                };
                for (let i = 0; i < this.meshes.length; i++) {
                    const mesh = this.meshes[i];
                    const material = mesh.material;
                    if (!material) {
                        done++;
                        if (done === this.meshes.length) {
                            return this._createFrames(resolve);
                        }
                        continue;
                    }
                    material.forceCompilationAsync(mesh).then(() => {
                        doneCheck(material);
                    });
                }
            }
            catch (e) {
                return reject(e);
            }
        });
    }
    /**
     * Disposes all textures associated with this packer
     */
    dispose() {
        const sKeys = Object.keys(this.sets);
        for (let i = 0; i < sKeys.length; i++) {
            const channel = sKeys[i];
            this.sets[channel].dispose();
        }
    }
    /**
     * Starts the download process for all the channels converting them to base64 data and embedding it all in a JSON file.
     * @param imageType is the image type to use.
     * @param quality of the image if downloading as jpeg, Ranges from >0 to 1.
     */
    download(imageType = "png", quality = 1) {
        setTimeout(() => {
            const pack = {
                name: this.name,
                sets: {},
                options: {},
                frames: [],
            };
            const sKeys = Object.keys(this.sets);
            const oKeys = Object.keys(this.options);
            try {
                for (let i = 0; i < sKeys.length; i++) {
                    const channel = sKeys[i];
                    const dt = this.sets[channel];
                    pack.sets[channel] = dt.getContext().canvas.toDataURL("image/" + imageType, quality);
                }
                for (let i = 0; i < oKeys.length; i++) {
                    const opt = oKeys[i];
                    pack.options[opt] = this.options[opt];
                }
                for (let i = 0; i < this.frames.length; i++) {
                    const _f = this.frames[i];
                    pack.frames.push(_f.scale.x, _f.scale.y, _f.offset.x, _f.offset.y);
                }
            }
            catch (err) {
                Logger.Warn("Unable to download: " + err);
                return;
            }
            const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pack, null, 4));
            const _a = document.createElement("a");
            _a.setAttribute("href", data);
            _a.setAttribute("download", this.name + "_texurePackage.json");
            document.body.appendChild(_a);
            _a.click();
            _a.remove();
        }, 0);
    }
    /**
     * Public method to load a texturePacker JSON file.
     * @param data of the JSON file in string format.
     */
    updateFromJSON(data) {
        try {
            const parsedData = JSON.parse(data);
            this.name = parsedData.name;
            const _options = Object.keys(parsedData.options);
            for (let i = 0; i < _options.length; i++) {
                this.options[_options[i]] = parsedData.options[_options[i]];
            }
            for (let i = 0; i < parsedData.frames.length; i += 4) {
                const frame = new TexturePackerFrame(i / 4, new Vector2(parsedData.frames[i], parsedData.frames[i + 1]), new Vector2(parsedData.frames[i + 2], parsedData.frames[i + 3]));
                this.frames.push(frame);
            }
            const channels = Object.keys(parsedData.sets);
            for (let i = 0; i < channels.length; i++) {
                const _t = new Texture(parsedData.sets[channels[i]], this.scene, false, false);
                this.sets[channels[i]] = _t;
            }
        }
        catch (err) {
            Logger.Warn("Unable to update from JSON: " + err);
        }
    }
}
/** Packer Layout Constant 0 */
TexturePacker.LAYOUT_STRIP = 0;
/** Packer Layout Constant 1 */
TexturePacker.LAYOUT_POWER2 = 1;
/** Packer Layout Constant 2 */
TexturePacker.LAYOUT_COLNUM = 2;
/** Packer Layout Constant 0 */
TexturePacker.SUBUV_WRAP = 0;
/** Packer Layout Constant 1 */
TexturePacker.SUBUV_EXTEND = 1;
/** Packer Layout Constant 2 */
TexturePacker.SUBUV_COLOR = 2;
//# sourceMappingURL=packer.js.map