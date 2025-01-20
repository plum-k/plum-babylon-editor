import { PrepareUniformsForColorCurves } from "./colorCurves.functions.js";
/**
 * Prepare the list of uniforms associated with the Image Processing effects.
 * @param uniforms The list of uniforms used in the effect
 * @param defines the list of defines currently in use
 */
export function PrepareUniformsForImageProcessing(uniforms, defines) {
    if (defines.EXPOSURE) {
        uniforms.push("exposureLinear");
    }
    if (defines.CONTRAST) {
        uniforms.push("contrast");
    }
    if (defines.COLORGRADING) {
        uniforms.push("colorTransformSettings");
    }
    if (defines.VIGNETTE || defines.DITHER) {
        uniforms.push("vInverseScreenSize");
    }
    if (defines.VIGNETTE) {
        uniforms.push("vignetteSettings1");
        uniforms.push("vignetteSettings2");
    }
    if (defines.COLORCURVES) {
        PrepareUniformsForColorCurves(uniforms);
    }
    if (defines.DITHER) {
        uniforms.push("ditherIntensity");
    }
}
/**
 * Prepare the list of samplers associated with the Image Processing effects.
 * @param samplersList The list of uniforms used in the effect
 * @param defines the list of defines currently in use
 */
export function PrepareSamplersForImageProcessing(samplersList, defines) {
    if (defines.COLORGRADING) {
        samplersList.push("txColorTransform");
    }
}
//# sourceMappingURL=imageProcessingConfiguration.functions.js.map