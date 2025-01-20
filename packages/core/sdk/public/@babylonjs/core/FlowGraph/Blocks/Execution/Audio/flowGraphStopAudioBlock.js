import { Sound } from "../../../../Audio/sound.js";
import { RichTypeAny } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Stops an audio.
 * @experimental
 */
export class FlowGraphStopAudioBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.audio = this.registerDataInput("audio", RichTypeAny);
    }
    _execute(context, _callingSignal) {
        const audioValue = this.audio.getValue(context);
        if (audioValue instanceof Sound) {
            audioValue.stop();
        }
    }
    getClassName() {
        return "FGStopAudioBlock";
    }
}
RegisterClass("FGStopAudioBlock", FlowGraphStopAudioBlock);
//# sourceMappingURL=flowGraphStopAudioBlock.js.map