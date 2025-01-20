import { Matrix } from "../../Maths/math.vector.js";
import { BaseTexture } from "../../Materials/Textures/baseTexture.js";

import { RegisterClass } from "../../Misc/typeStore.js";
/**
 * This represents a color grading texture. This acts as a lookup table LUT, useful during post process
 * It can help converting any input color in a desired output one. This can then be used to create effects
 * from sepia, black and white to sixties or futuristic rendering...
 *
 * The only supported format is currently 3dl.
 * More information on LUT: https://en.wikipedia.org/wiki/3D_lookup_table
 */
export class ColorGradingTexture extends BaseTexture {
    /**
     * Instantiates a ColorGradingTexture from the following parameters.
     *
     * @param url The location of the color grading data (currently only supporting 3dl)
     * @param sceneOrEngine The scene or engine the texture will be used in
     * @param onLoad defines a callback triggered when the texture has been loaded
     */
    constructor(url, sceneOrEngine, onLoad = null) {
        super(sceneOrEngine);
        if (!url) {
            return;
        }
        this._textureMatrix = Matrix.Identity();
        this.name = url;
        this.url = url;
        this._onLoad = onLoad;
        this._texture = this._getFromCache(url, true);
        if (!this._texture) {
            const scene = this.getScene();
            if (scene) {
                if (!scene.useDelayedTextureLoading) {
                    this._loadTexture();
                }
                else {
                    this.delayLoadState = 4;
                }
            }
            else {
                this._loadTexture();
            }
        }
        else {
            this._triggerOnLoad();
        }
    }
    /**
     * Fires the onload event from the constructor if requested.
     */
    _triggerOnLoad() {
        if (this._onLoad) {
            this._onLoad();
        }
    }
    /**
     * @returns the texture matrix used in most of the material.
     * This is not used in color grading but keep for troubleshooting purpose (easily swap diffuse by colorgrading to look in).
     */
    getTextureMatrix() {
        return this._textureMatrix;
    }
    /**
     * Occurs when the file being loaded is a .3dl LUT file.
     * @returns the 3D LUT texture
     */
    _load3dlTexture() {
        const engine = this._getEngine();
        let texture;
        if (!engine._features.support3DTextures) {
            texture = engine.createRawTexture(null, 1, 1, 5, false, false, 2, null, 0);
        }
        else {
            texture = engine.createRawTexture3D(null, 1, 1, 1, 5, false, false, 2, null, 0);
        }
        this._texture = texture;
        this._texture.isReady = false;
        this.isCube = false;
        this.is3D = engine._features.support3DTextures;
        this.wrapU = 0;
        this.wrapV = 0;
        this.wrapR = 0;
        this.anisotropicFilteringLevel = 1;
        const callback = (text) => {
            if (typeof text !== "string") {
                return;
            }
            let data = null;
            let tempData = null;
            let line;
            const lines = text.split("\n");
            let size = 0, pixelIndexW = 0, pixelIndexH = 0, pixelIndexSlice = 0;
            let maxColor = 0;
            for (let i = 0; i < lines.length; i++) {
                line = lines[i];
                if (!ColorGradingTexture._NoneEmptyLineRegex.test(line)) {
                    continue;
                }
                if (line.indexOf("#") === 0) {
                    continue;
                }
                const words = line.split(" ");
                if (size === 0) {
                    // Number of space + one
                    size = words.length;
                    data = new Uint8Array(size * size * size * 4); // volume texture of side size and rgb 8
                    tempData = new Float32Array(size * size * size * 4);
                    continue;
                }
                if (size != 0) {
                    const r = Math.max(parseInt(words[0]), 0);
                    const g = Math.max(parseInt(words[1]), 0);
                    const b = Math.max(parseInt(words[2]), 0);
                    maxColor = Math.max(r, maxColor);
                    maxColor = Math.max(g, maxColor);
                    maxColor = Math.max(b, maxColor);
                    const pixelStorageIndex = (pixelIndexW + pixelIndexSlice * size + pixelIndexH * size * size) * 4;
                    if (tempData) {
                        tempData[pixelStorageIndex + 0] = r;
                        tempData[pixelStorageIndex + 1] = g;
                        tempData[pixelStorageIndex + 2] = b;
                    }
                    // Keep for reference in case of back compat problems.
                    // pixelIndexSlice++;
                    // if (pixelIndexSlice % size == 0) {
                    //     pixelIndexH++;
                    //     pixelIndexSlice = 0;
                    //     if (pixelIndexH % size == 0) {
                    //         pixelIndexW++;
                    //         pixelIndexH = 0;
                    //     }
                    // }
                    pixelIndexH++;
                    if (pixelIndexH % size == 0) {
                        pixelIndexSlice++;
                        pixelIndexH = 0;
                        if (pixelIndexSlice % size == 0) {
                            pixelIndexW++;
                            pixelIndexSlice = 0;
                        }
                    }
                }
            }
            if (tempData && data) {
                for (let i = 0; i < tempData.length; i++) {
                    if (i > 0 && (i + 1) % 4 === 0) {
                        data[i] = 255;
                    }
                    else {
                        const value = tempData[i];
                        data[i] = (value / maxColor) * 255;
                    }
                }
            }
            if (texture.is3D) {
                texture.updateSize(size, size, size);
                engine.updateRawTexture3D(texture, data, 5, false);
            }
            else {
                texture.updateSize(size * size, size);
                engine.updateRawTexture(texture, data, 5, false);
            }
            texture.isReady = true;
            this._triggerOnLoad();
        };
        const scene = this.getScene();
        if (scene) {
            scene._loadFile(this.url, callback);
        }
        else {
            engine._loadFile(this.url, callback);
        }
        return this._texture;
    }
    /**
     * Starts the loading process of the texture.
     */
    _loadTexture() {
        if (this.url) {
            const url = this.url.toLocaleLowerCase();
            if (url.endsWith(".3dl") || url.startsWith("blob:")) {
                this._load3dlTexture();
            }
        }
    }
    /**
     * Clones the color grading texture.
     * @returns the cloned texture
     */
    clone() {
        const newTexture = new ColorGradingTexture(this.url, this.getScene() || this._getEngine());
        // Base texture
        newTexture.level = this.level;
        return newTexture;
    }
    /**
     * Called during delayed load for textures.
     */
    delayLoad() {
        if (this.delayLoadState !== 4) {
            return;
        }
        this.delayLoadState = 1;
        this._texture = this._getFromCache(this.url, true);
        if (!this._texture) {
            this._loadTexture();
        }
    }
    /**
     * Parses a color grading texture serialized by Babylon.
     * @param parsedTexture The texture information being parsedTexture
     * @param scene The scene to load the texture in
     * @returns A color grading texture
     */
    static Parse(parsedTexture, scene) {
        let texture = null;
        if (parsedTexture.name && !parsedTexture.isRenderTarget) {
            texture = new ColorGradingTexture(parsedTexture.name, scene);
            texture.name = parsedTexture.name;
            texture.level = parsedTexture.level;
        }
        return texture;
    }
    /**
     * Serializes the LUT texture to json format.
     * @returns The JSON representation of the texture
     */
    serialize() {
        if (!this.name) {
            return null;
        }
        const serializationObject = {};
        serializationObject.name = this.name;
        serializationObject.level = this.level;
        serializationObject.customType = "BABYLON.ColorGradingTexture";
        return serializationObject;
    }
}
/**
 * Empty line regex stored for GC.
 */
ColorGradingTexture._NoneEmptyLineRegex = /\S+/;
RegisterClass("BABYLON.ColorGradingTexture", ColorGradingTexture);
//# sourceMappingURL=colorGradingTexture.js.map