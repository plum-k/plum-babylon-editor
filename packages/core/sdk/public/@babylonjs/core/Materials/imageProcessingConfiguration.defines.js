import { MaterialDefines } from "./materialDefines.js";
/**
 * @internal
 */
export class ImageProcessingConfigurationDefines extends MaterialDefines {
    constructor() {
        super();
        this.IMAGEPROCESSING = false;
        this.VIGNETTE = false;
        this.VIGNETTEBLENDMODEMULTIPLY = false;
        this.VIGNETTEBLENDMODEOPAQUE = false;
        this.TONEMAPPING = 0;
        this.CONTRAST = false;
        this.COLORCURVES = false;
        this.COLORGRADING = false;
        this.COLORGRADING3D = false;
        this.SAMPLER3DGREENDEPTH = false;
        this.SAMPLER3DBGRMAP = false;
        this.DITHER = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.EXPOSURE = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.rebuild();
    }
}
//# sourceMappingURL=imageProcessingConfiguration.defines.js.map