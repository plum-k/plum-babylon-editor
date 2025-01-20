import { Observable } from "../Misc/observable.js";
import { Gamepad } from "./gamepad.js";
/**
 * Defines supported buttons for DualShock compatible gamepads
 */
export var DualShockButton;
(function (DualShockButton) {
    /** Cross */
    DualShockButton[DualShockButton["Cross"] = 0] = "Cross";
    /** Circle */
    DualShockButton[DualShockButton["Circle"] = 1] = "Circle";
    /** Square */
    DualShockButton[DualShockButton["Square"] = 2] = "Square";
    /** Triangle */
    DualShockButton[DualShockButton["Triangle"] = 3] = "Triangle";
    /** L1 */
    DualShockButton[DualShockButton["L1"] = 4] = "L1";
    /** R1 */
    DualShockButton[DualShockButton["R1"] = 5] = "R1";
    /** Share */
    DualShockButton[DualShockButton["Share"] = 8] = "Share";
    /** Options */
    DualShockButton[DualShockButton["Options"] = 9] = "Options";
    /** Left stick */
    DualShockButton[DualShockButton["LeftStick"] = 10] = "LeftStick";
    /** Right stick */
    DualShockButton[DualShockButton["RightStick"] = 11] = "RightStick";
})(DualShockButton || (DualShockButton = {}));
/** Defines values for DualShock DPad  */
export var DualShockDpad;
(function (DualShockDpad) {
    /** Up */
    DualShockDpad[DualShockDpad["Up"] = 12] = "Up";
    /** Down */
    DualShockDpad[DualShockDpad["Down"] = 13] = "Down";
    /** Left */
    DualShockDpad[DualShockDpad["Left"] = 14] = "Left";
    /** Right */
    DualShockDpad[DualShockDpad["Right"] = 15] = "Right";
})(DualShockDpad || (DualShockDpad = {}));
/**
 * Defines a DualShock gamepad
 */
export class DualShockPad extends Gamepad {
    /**
     * Creates a new DualShock gamepad object
     * @param id defines the id of this gamepad
     * @param index defines its index
     * @param gamepad defines the internal HTML gamepad object
     */
    constructor(id, index, gamepad) {
        super(id.replace("STANDARD GAMEPAD", "SONY PLAYSTATION DUALSHOCK"), index, gamepad, 0, 1, 2, 3);
        this._leftTrigger = 0;
        this._rightTrigger = 0;
        /** Observable raised when a button is pressed */
        this.onButtonDownObservable = new Observable();
        /** Observable raised when a button is released */
        this.onButtonUpObservable = new Observable();
        /** Observable raised when a pad is pressed */
        this.onPadDownObservable = new Observable();
        /** Observable raised when a pad is released */
        this.onPadUpObservable = new Observable();
        this._buttonCross = 0;
        this._buttonCircle = 0;
        this._buttonSquare = 0;
        this._buttonTriangle = 0;
        this._buttonShare = 0;
        this._buttonOptions = 0;
        this._buttonL1 = 0;
        this._buttonR1 = 0;
        this._buttonLeftStick = 0;
        this._buttonRightStick = 0;
        this._dPadUp = 0;
        this._dPadDown = 0;
        this._dPadLeft = 0;
        this._dPadRight = 0;
        this.type = Gamepad.DUALSHOCK;
    }
    /**
     * Defines the callback to call when left trigger is pressed
     * @param callback defines the callback to use
     */
    onlefttriggerchanged(callback) {
        this._onlefttriggerchanged = callback;
    }
    /**
     * Defines the callback to call when right trigger is pressed
     * @param callback defines the callback to use
     */
    onrighttriggerchanged(callback) {
        this._onrighttriggerchanged = callback;
    }
    /**
     * Gets the left trigger value
     */
    get leftTrigger() {
        return this._leftTrigger;
    }
    /**
     * Sets the left trigger value
     */
    set leftTrigger(newValue) {
        if (this._onlefttriggerchanged && this._leftTrigger !== newValue) {
            this._onlefttriggerchanged(newValue);
        }
        this._leftTrigger = newValue;
    }
    /**
     * Gets the right trigger value
     */
    get rightTrigger() {
        return this._rightTrigger;
    }
    /**
     * Sets the right trigger value
     */
    set rightTrigger(newValue) {
        if (this._onrighttriggerchanged && this._rightTrigger !== newValue) {
            this._onrighttriggerchanged(newValue);
        }
        this._rightTrigger = newValue;
    }
    /**
     * Defines the callback to call when a button is pressed
     * @param callback defines the callback to use
     */
    onbuttondown(callback) {
        this._onbuttondown = callback;
    }
    /**
     * Defines the callback to call when a button is released
     * @param callback defines the callback to use
     */
    onbuttonup(callback) {
        this._onbuttonup = callback;
    }
    /**
     * Defines the callback to call when a pad is pressed
     * @param callback defines the callback to use
     */
    ondpaddown(callback) {
        this._ondpaddown = callback;
    }
    /**
     * Defines the callback to call when a pad is released
     * @param callback defines the callback to use
     */
    ondpadup(callback) {
        this._ondpadup = callback;
    }
    _setButtonValue(newValue, currentValue, buttonType) {
        if (newValue !== currentValue) {
            if (newValue === 1) {
                if (this._onbuttondown) {
                    this._onbuttondown(buttonType);
                }
                this.onButtonDownObservable.notifyObservers(buttonType);
            }
            if (newValue === 0) {
                if (this._onbuttonup) {
                    this._onbuttonup(buttonType);
                }
                this.onButtonUpObservable.notifyObservers(buttonType);
            }
        }
        return newValue;
    }
    _setDPadValue(newValue, currentValue, buttonType) {
        if (newValue !== currentValue) {
            if (newValue === 1) {
                if (this._ondpaddown) {
                    this._ondpaddown(buttonType);
                }
                this.onPadDownObservable.notifyObservers(buttonType);
            }
            if (newValue === 0) {
                if (this._ondpadup) {
                    this._ondpadup(buttonType);
                }
                this.onPadUpObservable.notifyObservers(buttonType);
            }
        }
        return newValue;
    }
    /**
     * Gets the value of the `Cross` button
     */
    get buttonCross() {
        return this._buttonCross;
    }
    /**
     * Sets the value of the `Cross` button
     */
    set buttonCross(value) {
        this._buttonCross = this._setButtonValue(value, this._buttonCross, 0 /* DualShockButton.Cross */);
    }
    /**
     * Gets the value of the `Circle` button
     */
    get buttonCircle() {
        return this._buttonCircle;
    }
    /**
     * Sets the value of the `Circle` button
     */
    set buttonCircle(value) {
        this._buttonCircle = this._setButtonValue(value, this._buttonCircle, 1 /* DualShockButton.Circle */);
    }
    /**
     * Gets the value of the `Square` button
     */
    get buttonSquare() {
        return this._buttonSquare;
    }
    /**
     * Sets the value of the `Square` button
     */
    set buttonSquare(value) {
        this._buttonSquare = this._setButtonValue(value, this._buttonSquare, 2 /* DualShockButton.Square */);
    }
    /**
     * Gets the value of the `Triangle` button
     */
    get buttonTriangle() {
        return this._buttonTriangle;
    }
    /**
     * Sets the value of the `Triangle` button
     */
    set buttonTriangle(value) {
        this._buttonTriangle = this._setButtonValue(value, this._buttonTriangle, 3 /* DualShockButton.Triangle */);
    }
    /**
     * Gets the value of the `Options` button
     */
    get buttonOptions() {
        return this._buttonOptions;
    }
    /**
     * Sets the value of the `Options` button
     */
    set buttonOptions(value) {
        this._buttonOptions = this._setButtonValue(value, this._buttonOptions, 9 /* DualShockButton.Options */);
    }
    /**
     * Gets the value of the `Share` button
     */
    get buttonShare() {
        return this._buttonShare;
    }
    /**
     * Sets the value of the `Share` button
     */
    set buttonShare(value) {
        this._buttonShare = this._setButtonValue(value, this._buttonShare, 8 /* DualShockButton.Share */);
    }
    /**
     * Gets the value of the `L1` button
     */
    get buttonL1() {
        return this._buttonL1;
    }
    /**
     * Sets the value of the `L1` button
     */
    set buttonL1(value) {
        this._buttonL1 = this._setButtonValue(value, this._buttonL1, 4 /* DualShockButton.L1 */);
    }
    /**
     * Gets the value of the `R1` button
     */
    get buttonR1() {
        return this._buttonR1;
    }
    /**
     * Sets the value of the `R1` button
     */
    set buttonR1(value) {
        this._buttonR1 = this._setButtonValue(value, this._buttonR1, 5 /* DualShockButton.R1 */);
    }
    /**
     * Gets the value of the Left joystick
     */
    get buttonLeftStick() {
        return this._buttonLeftStick;
    }
    /**
     * Sets the value of the Left joystick
     */
    set buttonLeftStick(value) {
        this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, 10 /* DualShockButton.LeftStick */);
    }
    /**
     * Gets the value of the Right joystick
     */
    get buttonRightStick() {
        return this._buttonRightStick;
    }
    /**
     * Sets the value of the Right joystick
     */
    set buttonRightStick(value) {
        this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, 11 /* DualShockButton.RightStick */);
    }
    /**
     * Gets the value of D-pad up
     */
    get dPadUp() {
        return this._dPadUp;
    }
    /**
     * Sets the value of D-pad up
     */
    set dPadUp(value) {
        this._dPadUp = this._setDPadValue(value, this._dPadUp, 12 /* DualShockDpad.Up */);
    }
    /**
     * Gets the value of D-pad down
     */
    get dPadDown() {
        return this._dPadDown;
    }
    /**
     * Sets the value of D-pad down
     */
    set dPadDown(value) {
        this._dPadDown = this._setDPadValue(value, this._dPadDown, 13 /* DualShockDpad.Down */);
    }
    /**
     * Gets the value of D-pad left
     */
    get dPadLeft() {
        return this._dPadLeft;
    }
    /**
     * Sets the value of D-pad left
     */
    set dPadLeft(value) {
        this._dPadLeft = this._setDPadValue(value, this._dPadLeft, 14 /* DualShockDpad.Left */);
    }
    /**
     * Gets the value of D-pad right
     */
    get dPadRight() {
        return this._dPadRight;
    }
    /**
     * Sets the value of D-pad right
     */
    set dPadRight(value) {
        this._dPadRight = this._setDPadValue(value, this._dPadRight, 15 /* DualShockDpad.Right */);
    }
    /**
     * Force the gamepad to synchronize with device values
     */
    update() {
        super.update();
        this.buttonCross = this.browserGamepad.buttons[0].value;
        this.buttonCircle = this.browserGamepad.buttons[1].value;
        this.buttonSquare = this.browserGamepad.buttons[2].value;
        this.buttonTriangle = this.browserGamepad.buttons[3].value;
        this.buttonL1 = this.browserGamepad.buttons[4].value;
        this.buttonR1 = this.browserGamepad.buttons[5].value;
        this.leftTrigger = this.browserGamepad.buttons[6].value;
        this.rightTrigger = this.browserGamepad.buttons[7].value;
        this.buttonShare = this.browserGamepad.buttons[8].value;
        this.buttonOptions = this.browserGamepad.buttons[9].value;
        this.buttonLeftStick = this.browserGamepad.buttons[10].value;
        this.buttonRightStick = this.browserGamepad.buttons[11].value;
        this.dPadUp = this.browserGamepad.buttons[12].value;
        this.dPadDown = this.browserGamepad.buttons[13].value;
        this.dPadLeft = this.browserGamepad.buttons[14].value;
        this.dPadRight = this.browserGamepad.buttons[15].value;
    }
    /**
     * Disposes the gamepad
     */
    dispose() {
        super.dispose();
        this.onButtonDownObservable.clear();
        this.onButtonUpObservable.clear();
        this.onPadDownObservable.clear();
        this.onPadUpObservable.clear();
    }
}
//# sourceMappingURL=dualShockGamepad.js.map