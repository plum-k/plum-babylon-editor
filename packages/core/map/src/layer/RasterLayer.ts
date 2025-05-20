import {ILayerOptions, Layer} from "./Layer";
import {Source} from "../source";
import {values} from "lodash-es";

export interface IRasterLayerOptions extends ILayerOptions {
    source: Source;
}

// 栅格图层
export class RasterLayer extends Layer {
    isRasterLayer = true

    constructor(options: IRasterLayerOptions) {
        super(options);
    }
}

export function isRasterLayer(value: Layer): value is  RasterLayer {
    return value.isRasterLayer;
}

