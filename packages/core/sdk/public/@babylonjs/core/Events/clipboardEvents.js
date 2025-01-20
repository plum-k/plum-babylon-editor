/**
 * Gather the list of clipboard event types as constants.
 */
export class ClipboardEventTypes {
}
/**
 * The clipboard event is fired when a copy command is active (pressed).
 */
ClipboardEventTypes.COPY = 0x01; //
/**
 *  The clipboard event is fired when a cut command is active (pressed).
 */
ClipboardEventTypes.CUT = 0x02;
/**
 * The clipboard event is fired when a paste command is active (pressed).
 */
ClipboardEventTypes.PASTE = 0x03;
/**
 * This class is used to store clipboard related info for the onClipboardObservable event.
 */
export class ClipboardInfo {
    /**
     *Creates an instance of ClipboardInfo.
     * @param type Defines the type of event (BABYLON.ClipboardEventTypes)
     * @param event Defines the related dom event
     */
    constructor(
    /**
     * Defines the type of event (BABYLON.ClipboardEventTypes)
     */
    type, 
    /**
     * Defines the related dom event
     */
    event) {
        this.type = type;
        this.event = event;
    }
    /**
     *  Get the clipboard event's type from the keycode.
     * @param keyCode Defines the keyCode for the current keyboard event.
     * @returns {number}
     */
    static GetTypeFromCharacter(keyCode) {
        const charCode = keyCode;
        //TODO: add codes for extended ASCII
        switch (charCode) {
            case 67:
                return ClipboardEventTypes.COPY;
            case 86:
                return ClipboardEventTypes.PASTE;
            case 88:
                return ClipboardEventTypes.CUT;
            default:
                return -1;
        }
    }
}
//# sourceMappingURL=clipboardEvents.js.map