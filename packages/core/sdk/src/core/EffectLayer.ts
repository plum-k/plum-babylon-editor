import {BasePlum, IBasePlumOptions} from "./BasePlum";
import {GlowLayer, HighlightLayer} from "@babylonjs/core";

export interface IEffectLayer extends IBasePlumOptions {
}


export class EffectLayer extends BasePlum {
    highlightLayer: HighlightLayer
    glowLayer: GlowLayer;

    constructor(options: IEffectLayer) {
        super(options);
        const {viewer} = options;

        // this.highlightLayer = new HighlightLayer("highlightLayer", this.scene);

        // todo 默认就会有影响
        // this.glowLayer = new GlowLayer("glowLayer", this.scene);
        // console.log(this.glowLayer.renderingGroupId)
        // box 的组会有冲突
        // this.glowLayer.renderingGroupId = 99
    }
}
