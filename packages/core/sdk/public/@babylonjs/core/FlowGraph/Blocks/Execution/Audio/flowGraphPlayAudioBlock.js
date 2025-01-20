import { Sound } from "../../../../Audio/sound.js";
import { RichTypeAny } from "../../../flowGraphRichTypes.js";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * @experimental
 * A block that plays an audio.
 */
export class FlowGraphPlayAudioBlock extends FlowGraphExecutionBlockWithOutSignal {
    constructor(config) {
        super(config);
        this.audio = this.registerDataInput("audio", RichTypeAny);
    }
    _execute(context, _callingSignal) {
        const audioValue = this.audio.getValue(context);
        if (audioValue instanceof Sound) {
            audioValue.play();
        }
        this.out._activateSignal(context);
    }
    getClassName() {
        return "FGPlayAudioBlock";
    }
}
RegisterClass("FGPlayAudioBlock", FlowGraphPlayAudioBlock);
//# sourceMappingURL=flowGraphPlayAudioBlock.js.map