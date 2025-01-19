import {BasePlum, IBasePlumOptions} from "../core/BasePlum";
import {DefaultRenderingPipeline} from "@babylonjs/core";

export interface IThreeCameraControls extends IBasePlumOptions {
}

export class PlumPostProcessManager extends BasePlum {
    defaultRenderingPipeline: DefaultRenderingPipeline;

    constructor(options: IThreeCameraControls) {
        super(options);
        this.defaultRenderingPipeline = new DefaultRenderingPipeline(
            "DefaultRenderingPipeline",
            true,
            this.scene,
            this.scene.cameras
        );
        this.defaultRenderingPipeline.imageProcessingEnabled = false

        // this.standardPipeline = new PostProcessRenderPipeline(this.engine, "standardPipeline");
        //
        // const blackAndWhite = new BlackAndWhitePostProcess("bw", 1.0, null, undefined, this.engine, false);
        // // var horizontalBlur = new BlurPostProcess("hb", new Vector2(1.0, 0), 20, 1.0, null, null, engine, false);
        // const blackAndWhiteThenBlur = new PostProcessRenderEffect(this.engine, "blackAndWhiteThenBlur", () => [blackAndWhite]);
        //
        // this.standardPipeline.addEffect(blackAndWhiteThenBlur);
        //
        // this.scene.postProcessRenderPipelineManager.addPipeline(this.standardPipeline);
    }

    open() {
        // this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("standardPipeline", this.scene.activeCamera);
    }

    close() {
        // this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("standardPipeline", this.scene.activeCamera);

    }

}

