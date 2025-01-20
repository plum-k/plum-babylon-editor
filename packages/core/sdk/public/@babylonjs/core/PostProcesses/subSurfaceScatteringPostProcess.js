import { Texture } from "../Materials/Textures/texture.js";
import { PostProcess } from "./postProcess.js";

import { Logger } from "../Misc/logger.js";
import "../Shaders/imageProcessing.fragment.js";
import "../Shaders/subSurfaceScattering.fragment.js";
import "../Shaders/postprocess.vertex.js";
/**
 * Sub surface scattering post process
 */
export class SubSurfaceScatteringPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "SubSurfaceScatteringPostProcess" string
     */
    getClassName() {
        return "SubSurfaceScatteringPostProcess";
    }
    constructor(name, scene, options, camera = null, samplingMode, engine, reusable, textureType = 0) {
        super(name, "subSurfaceScattering", ["texelSize", "viewportSize", "metersPerUnit"], ["diffusionS", "diffusionD", "filterRadii", "irradianceSampler", "depthSampler", "albedoSampler"], options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "postprocess", undefined, true);
        this._scene = scene;
        this.updateEffect();
        this.onApplyObservable.add((effect) => {
            if (!scene.prePassRenderer || !scene.subSurfaceConfiguration) {
                Logger.Error("PrePass and subsurface configuration needs to be enabled for subsurface scattering.");
                return;
            }
            const texelSize = this.texelSize;
            effect.setFloat("metersPerUnit", scene.subSurfaceConfiguration.metersPerUnit);
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            effect.setTexture("irradianceSampler", scene.prePassRenderer.getRenderTarget().textures[scene.prePassRenderer.getIndex(0)]);
            effect.setTexture("depthSampler", scene.prePassRenderer.getRenderTarget().textures[scene.prePassRenderer.getIndex(5)]);
            effect.setTexture("albedoSampler", scene.prePassRenderer.getRenderTarget().textures[scene.prePassRenderer.getIndex(7)]);
            effect.setFloat2("viewportSize", Math.tan(scene.activeCamera.fov / 2) * scene.getEngine().getAspectRatio(scene.activeCamera, true), Math.tan(scene.activeCamera.fov / 2));
            effect.setArray3("diffusionS", scene.subSurfaceConfiguration.ssDiffusionS);
            effect.setArray("diffusionD", scene.subSurfaceConfiguration.ssDiffusionD);
            effect.setArray("filterRadii", scene.subSurfaceConfiguration.ssFilterRadii);
        });
    }
}
//# sourceMappingURL=subSurfaceScatteringPostProcess.js.map