import { ExternalTexture } from "../../Materials/Textures/externalTexture.js";
/**
 * Nothing specific to WebGPU in this class, but the spec is not final yet so let's remove it later on
 * if it is not needed
 * @internal
 **/
export class WebGPUExternalTexture extends ExternalTexture {
    constructor(video) {
        super(video);
    }
}
//# sourceMappingURL=webgpuExternalTexture.js.map