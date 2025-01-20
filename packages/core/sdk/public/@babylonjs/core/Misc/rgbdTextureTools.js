
import { PostProcess } from "../PostProcesses/postProcess.js";
import { ApplyPostProcess } from "./textureTools.js";
/**
 * Class used to host RGBD texture specific utilities
 */
export class RGBDTextureTools {
    /**
     * Expand the RGBD Texture from RGBD to Half Float if possible.
     * @param texture the texture to expand.
     */
    static ExpandRGBDTexture(texture) {
        const internalTexture = texture._texture;
        if (!internalTexture || !texture.isRGBD) {
            return;
        }
        // Gets everything ready.
        const engine = internalTexture.getEngine();
        const caps = engine.getCaps();
        const isReady = internalTexture.isReady;
        let expandTexture = false;
        // If half float available we can uncompress the texture
        if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
            expandTexture = true;
            internalTexture.type = 2;
        }
        // If full float available we can uncompress the texture
        else if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
            expandTexture = true;
            internalTexture.type = 1;
        }
        if (expandTexture) {
            // Do not use during decode.
            internalTexture.isReady = false;
            internalTexture._isRGBD = false;
            internalTexture.invertY = false;
        }
        const expandRGBDTexture = async () => {
            const isWebGPU = engine.isWebGPU;
            const shaderLanguage = isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */;
            internalTexture.isReady = false;
            if (isWebGPU) {
                await import("../ShadersWGSL/rgbdDecode.fragment.js");
            }
            else {
                await import("../Shaders/rgbdDecode.fragment.js");
            }
            // Expand the texture if possible
            // Simply run through the decode PP.
            const rgbdPostProcess = new PostProcess("rgbdDecode", "rgbdDecode", null, null, 1, null, 3, engine, false, undefined, internalTexture.type, undefined, null, false, undefined, shaderLanguage);
            rgbdPostProcess.externalTextureSamplerBinding = true;
            // Hold the output of the decoding.
            const expandedTexture = engine.createRenderTargetTexture(internalTexture.width, {
                generateDepthBuffer: false,
                generateMipMaps: false,
                generateStencilBuffer: false,
                samplingMode: internalTexture.samplingMode,
                type: internalTexture.type,
                format: 5,
            });
            rgbdPostProcess.onEffectCreatedObservable.addOnce((e) => {
                e.executeWhenCompiled(() => {
                    // PP Render Pass
                    rgbdPostProcess.onApply = (effect) => {
                        effect._bindTexture("textureSampler", internalTexture);
                        effect.setFloat2("scale", 1, 1);
                    };
                    texture.getScene().postProcessManager.directRender([rgbdPostProcess], expandedTexture, true);
                    // Cleanup
                    engine.restoreDefaultFramebuffer();
                    engine._releaseTexture(internalTexture);
                    if (rgbdPostProcess) {
                        rgbdPostProcess.dispose();
                    }
                    // Internal Swap
                    expandedTexture._swapAndDie(internalTexture);
                    // Ready to get rolling again.
                    internalTexture.isReady = true;
                });
            });
        };
        if (expandTexture) {
            if (isReady) {
                expandRGBDTexture();
            }
            else {
                texture.onLoadObservable.addOnce(expandRGBDTexture);
            }
        }
    }
    /**
     * Encode the texture to RGBD if possible.
     * @param internalTexture the texture to encode
     * @param scene the scene hosting the texture
     * @param outputTextureType type of the texture in which the encoding is performed
     * @returns a promise with the internalTexture having its texture replaced by the result of the processing
     */
    static async EncodeTextureToRGBD(internalTexture, scene, outputTextureType = 0) {
        if (!scene.getEngine().isWebGPU) {
            await import("../Shaders/rgbdEncode.fragment.js");
        }
        else {
            await import("../ShadersWGSL/rgbdEncode.fragment.js");
        }
        return ApplyPostProcess("rgbdEncode", internalTexture, scene, outputTextureType, 1, 5);
    }
}
//# sourceMappingURL=rgbdTextureTools.js.map