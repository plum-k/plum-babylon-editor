import { Action } from "./action.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * This defines an action helpful to play a defined sound on a triggered action.
 */
export class PlaySoundAction extends Action {
    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param sound defines the sound to play
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions, sound, condition) {
        super(triggerOptions, condition);
        this._sound = sound;
    }
    /** @internal */
    _prepare() { }
    /**
     * Execute the action and play the sound.
     */
    execute() {
        if (this._sound !== undefined) {
            this._sound.play();
        }
    }
    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    serialize(parent) {
        return super._serialize({
            name: "PlaySoundAction",
            properties: [{ name: "sound", value: this._sound.name }],
        }, parent);
    }
}
/**
 * This defines an action helpful to stop a defined sound on a triggered action.
 */
export class StopSoundAction extends Action {
    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param sound defines the sound to stop
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions, sound, condition) {
        super(triggerOptions, condition);
        this._sound = sound;
    }
    /** @internal */
    _prepare() { }
    /**
     * Execute the action and stop the sound.
     */
    execute() {
        if (this._sound !== undefined) {
            this._sound.stop();
        }
    }
    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    serialize(parent) {
        return super._serialize({
            name: "StopSoundAction",
            properties: [{ name: "sound", value: this._sound.name }],
        }, parent);
    }
}
RegisterClass("BABYLON.PlaySoundAction", PlaySoundAction);
RegisterClass("BABYLON.StopSoundAction", StopSoundAction);
//# sourceMappingURL=directAudioActions.js.map