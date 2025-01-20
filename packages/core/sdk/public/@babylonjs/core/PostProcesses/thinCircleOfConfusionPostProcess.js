import { EffectWrapper } from "../Materials/effectRenderer.js";
import { Engine } from "../Engines/engine.js";
/**
 * Post process used to calculate the circle of confusion (used for depth of field, for example)
 */
export class ThinCircleOfConfusionPostProcess extends EffectWrapper {
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/circleOfConfusion.fragment.js"));
        }
        else {
            list.push(import("../Shaders/circleOfConfusion.fragment.js"));
        }
    }
    /**
     * Constructs a new circle of confusion post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name, engine = null, options) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinCircleOfConfusionPostProcess.FragmentUrl,
            uniforms: ThinCircleOfConfusionPostProcess.Uniforms,
            samplers: ThinCircleOfConfusionPostProcess.Samplers,
            defines: options?.depthNotNormalized ? ThinCircleOfConfusionPostProcess.DefinesDepthNotNormalized : undefined,
        });
        /**
         * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
         */
        this.lensSize = 50;
        /**
         * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
         */
        this.fStop = 1.4;
        /**
         * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
         */
        this.focusDistance = 2000;
        /**
         * Focal length of the effect's camera in scene units/1000 (eg. millimeter). (default: 50)
         */
        this.focalLength = 50;
    }
    bind() {
        super.bind();
        const options = this.options;
        const effect = this._drawWrapper.effect;
        if (!options.depthNotNormalized) {
            effect.setFloat2("cameraMinMaxZ", this.camera.minZ, this.camera.maxZ - this.camera.minZ);
        }
        // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
        const aperture = this.lensSize / this.fStop;
        const cocPrecalculation = (aperture * this.focalLength) / (this.focusDistance - this.focalLength); // * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]
        effect.setFloat("focusDistance", this.focusDistance);
        effect.setFloat("cocPrecalculation", cocPrecalculation);
    }
}
/**
 * The fragment shader url
 */
ThinCircleOfConfusionPostProcess.FragmentUrl = "circleOfConfusion";
/**
 * The list of uniforms used by the effect
 */
ThinCircleOfConfusionPostProcess.Uniforms = ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"];
/**
 * The list of samplers used by the effect
 */
ThinCircleOfConfusionPostProcess.Samplers = ["depthSampler"];
/**
 * Defines if the depth is normalized or not
 */
ThinCircleOfConfusionPostProcess.DefinesDepthNotNormalized = "#define COC_DEPTH_NOT_NORMALIZED";
//# sourceMappingURL=thinCircleOfConfusionPostProcess.js.map