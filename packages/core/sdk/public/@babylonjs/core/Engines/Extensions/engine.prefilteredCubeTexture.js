import { ThinEngine } from "../../Engines/thinEngine.js";
import { InternalTexture } from "../../Materials/Textures/internalTexture.js";
import { Logger } from "../../Misc/logger.js";

import { SphericalPolynomial } from "../../Maths/sphericalPolynomial.js";
import { BaseTexture } from "../../Materials/Textures/baseTexture.js";
ThinEngine.prototype.createPrefilteredCubeTexture = function (rootUrl, scene, lodScale, lodOffset, onLoad = null, onError = null, format, forcedExtension = null, createPolynomials = true) {
    const callback = async (loadData) => {
        if (!loadData) {
            if (onLoad) {
                onLoad(null);
            }
            return;
        }
        const texture = loadData.texture;
        if (!createPolynomials) {
            texture._sphericalPolynomial = new SphericalPolynomial();
        }
        else if (loadData.info.sphericalPolynomial) {
            texture._sphericalPolynomial = loadData.info.sphericalPolynomial;
        }
        texture._source = 9 /* InternalTextureSource.CubePrefiltered */;
        if (this.getCaps().textureLOD) {
            // Do not add extra process if texture lod is supported.
            if (onLoad) {
                onLoad(texture);
            }
            return;
        }
        const mipSlices = 3;
        const gl = this._gl;
        const width = loadData.width;
        if (!width) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { DDSTools } = await import("../../Misc/dds.js");
        const textures = [];
        for (let i = 0; i < mipSlices; i++) {
            //compute LOD from even spacing in smoothness (matching shader calculation)
            const smoothness = i / (mipSlices - 1);
            const roughness = 1 - smoothness;
            const minLODIndex = lodOffset; // roughness = 0
            const maxLODIndex = Math.log2(width) * lodScale + lodOffset; // roughness = 1
            const lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
            const mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));
            const glTextureFromLod = new InternalTexture(this, 2 /* InternalTextureSource.Temp */);
            glTextureFromLod.type = texture.type;
            glTextureFromLod.format = texture.format;
            glTextureFromLod.width = Math.pow(2, Math.max(Math.log2(width) - mipmapIndex, 0));
            glTextureFromLod.height = glTextureFromLod.width;
            glTextureFromLod.isCube = true;
            glTextureFromLod._cachedWrapU = 0;
            glTextureFromLod._cachedWrapV = 0;
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, glTextureFromLod, true);
            glTextureFromLod.samplingMode = 2;
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if (loadData.isDDS) {
                const info = loadData.info;
                const data = loadData.data;
                this._unpackFlipY(info.isCompressed);
                DDSTools.UploadDDSLevels(this, glTextureFromLod, data, info, true, 6, mipmapIndex);
            }
            else {
                Logger.Warn("DDS is the only prefiltered cube map supported so far.");
            }
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
            // Wrap in a base texture for easy binding.
            const lodTexture = new BaseTexture(scene);
            lodTexture._isCube = true;
            lodTexture._texture = glTextureFromLod;
            glTextureFromLod.isReady = true;
            textures.push(lodTexture);
        }
        texture._lodTextureHigh = textures[2];
        texture._lodTextureMid = textures[1];
        texture._lodTextureLow = textures[0];
        if (onLoad) {
            onLoad(texture);
        }
    };
    return this.createCubeTexture(rootUrl, scene, null, false, callback, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset);
};
//# sourceMappingURL=engine.prefilteredCubeTexture.js.map