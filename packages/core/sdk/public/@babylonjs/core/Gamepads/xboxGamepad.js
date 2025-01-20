import { Observable } from "../Misc/observable.js";
import { Gamepad } from "../Gamepads/gamepad.js";
/**
 * Defines supported buttons for XBox360 compatible gamepads
 */
export var Xbox360Button;
(function (Xbox360Button) {
    /** A */
    Xbox360Button[Xbox360Button["A"] = 0] = "A";
    /** B */
    Xbox360Button[Xbox360Button["B"] = 1] = "B";
    /** X */
    Xbox360Button[Xbox360Button["X"] = 2] = "X";
    /** Y */
    Xbox360Button[Xbox360Button["Y"] = 3] = "Y";
    /** Left button */
    Xbox360Button[Xbox360Button["LB"] = 4] = "LB";
    /** Right button */
    Xbox360Button[Xbox360Button["RB"] = 5] = "RB";
    /** Back */
    Xbox360Button[Xbox360Button["Back"] = 8] = "Back";
    /** Start */
    Xbox360Button[Xbox360Button["Start"] = 9] = "Start";
    /** Left stick */
    Xbox360Button[Xbox360Button["LeftStick"] = 10] = "LeftStick";
    /** Right stick */
    Xbox360Button[Xbox360Button["RightStick"] = 11] = "RightStick";
})(Xbox360Button || (Xbox360Button = {}));
/** Defines values for XBox360 DPad  */
export var Xbox360Dpad;
(function (Xbox360Dpad) {
    /** Up */
    Xbox360Dpad[Xbox360Dpad["Up"] = 12] = "Up";
    /** Down */
    Xbox360Dpad[Xbox360Dpad["Down"] = 13] = "Down";
    /** Left */
    Xbox360Dpad[Xbox360Dpad["Left"] = 14] = "Left";
    /** Right */
    Xbox360Dpad[Xbox360Dpad["Right"] = 15] = "Right";
})(Xbox360Dpad || (Xbox360Dpad = {}));
/**
 * Defines a XBox360 gamepad
 */
export class Xbox360Pad extends Gamepad {
    /**
     * Creates a new XBox360 gamepad object
     * @param id defines the id of this gamepad
     * @param index defines its index
     * @param gamepad defines the internal HTML gamepad object
     * @param xboxOne defines if it is a XBox One gamepad
     */
    constructor(id, index, gamepad, xboxOne = false) {
        super(id, index, gamepad, 0, 1, 2, 3);
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
        this._buttonA = 0;
        this._buttonB = 0;
        this._buttonX = 0;
        this._buttonY = 0;
        this._buttonBack = 0;
        this._buttonStart = 0;
        this._buttonLB = 0;
        this._buttonRB = 0;
        this._buttonLeftStick = 0;
        this._buttonRightStick = 0;
        this._dPadUp = 0;
        this._dPadDown = 0;
        this._dPadLeft = 0;
        this._dPadRight = 0;
        this._isXboxOnePad = false;
        this.type = Gamepad.XBOX;
        this._isXboxOnePad = xboxOne;
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
     * Gets the value of the `A` button
     */
    get buttonA() {
        return this._buttonA;
    }
    /**
     * Sets the value of the `A` button
     */
    set buttonA(value) {
        this._buttonA = this._setButtonValue(value, this._buttonA, 0 /* Xbox360Button.A */);
    }
    /**
     * Gets the value of the `B` button
     */
    get buttonB() {
        return this._buttonB;
    }
    /**
     * Sets the value of the `B` button
     */
    set buttonB(value) {
        this._buttonB = this._setButtonValue(value, this._buttonB, 1 /* Xbox360Button.B */);
    }
    /**
     * Gets the value of the `X` button
     */
    get buttonX() {
        return this._buttonX;
    }
    /**
     * Sets the value of the `X` button
     */
    set buttonX(value) {
        this._buttonX = this._setButtonValue(value, this._buttonX, 2 /* Xbox360Button.X */);
    }
    /**
     * Gets the value of the `Y` button
     */
    get buttonY() {
        return this._buttonY;
    }
    /**
     * Sets the value of the `Y` button
     */
    set buttonY(value) {
        this._buttonY = this._setButtonValue(value, this._buttonY, 3 /* Xbox360Button.Y */);
    }
    /**
     * Gets the value of the `Start` button
     */
    get buttonStart() {
        return this._buttonStart;
    }
    /**
     * Sets the value of the `Start` button
     */
    set buttonStart(value) {
        this._buttonStart = this._setButtonValue(value, this._buttonStart, 9 /* Xbox360Button.Start */);
    }
    /**
     * Gets the value of the `Back` button
     */
    get buttonBack() {
        return this._buttonBack;
    }
    /**
     * Sets the value of the `Back` button
     */
    set buttonBack(value) {
        this._buttonBack = this._setButtonValue(value, this._buttonBack, 8 /* Xbox360Button.Back */);
    }
    /**
     * Gets the value of the `Left` button
     */
    get buttonLB() {
        return this._buttonLB;
    }
    /**
     * Sets the value of the `Left` button
     */
    set buttonLB(value) {
        this._buttonLB = this._setButtonValue(value, this._buttonLB, 4 /* Xbox360Button.LB */);
    }
    /**
     * Gets the value of the `Right` button
     */
    get buttonRB() {
        return this._buttonRB;
    }
    /**
     * Sets the value of the `Right` button
     */
    set buttonRB(value) {
        this._buttonRB = this._setButtonValue(value, this._buttonRB, 5 /* Xbox360Button.RB */);
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
        this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, 10 /* Xbox360Button.LeftStick */);
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
        this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, 11 /* Xbox360Button.RightStick */);
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
        this._dPadUp = this._setDPadValue(value, this._dPadUp, 12 /* Xbox360Dpad.Up */);
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
        this._dPadDown = this._setDPadValue(value, this._dPadDown, 13 /* Xbox360Dpad.Down */);
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
        this._dPadLeft = this._setDPadValue(value, this._dPadLeft, 14 /* Xbox360Dpad.Left */);
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
        this._dPadRight = this._setDPadValue(value, this._dPadRight, 15 /* Xbox360Dpad.Right */);
    }
    /**
     * Force the gamepad to synchronize with device values
     */
    update() {
        super.update();
        if (this._isXboxOnePad) {
            this.buttonA = this.browserGamepad.buttons[0].value;
            this.buttonB = this.browserGamepad.buttons[1].value;
            this.buttonX = this.browserGamepad.buttons[2].value;
            this.buttonY = this.browserGamepad.buttons[3].value;
            this.buttonLB = this.browserGamepad.buttons[4].value;
            this.buttonRB = this.browserGamepad.buttons[5].value;
            this.leftTrigger = this.browserGamepad.buttons[6].value;
            this.rightTrigger = this.browserGamepad.buttons[7].value;
            this.buttonBack = this.browserGamepad.buttons[8].value;
            this.buttonStart = this.browserGamepad.buttons[9].value;
            this.buttonLeftStick = this.browserGamepad.buttons[10].value;
            this.buttonRightStick = this.browserGamepad.buttons[11].value;
            this.dPadUp = this.browserGamepad.buttons[12].value;
            this.dPadDown = this.browserGamepad.buttons[13].value;
            this.dPadLeft = this.browserGamepad.buttons[14].value;
            this.dPadRight = this.browserGamepad.buttons[15].value;
        }
        else {
            this.buttonA = this.browserGamepad.buttons[0].value;
            this.buttonB = this.browserGamepad.buttons[1].value;
            this.buttonX = this.browserGamepad.buttons[2].value;
            this.buttonY = this.browserGamepad.buttons[3].value;
            this.buttonLB = this.browserGamepad.buttons[4].value;
            this.buttonRB = this.browserGamepad.buttons[5].value;
            this.leftTrigger = this.browserGamepad.buttons[6].value;
            this.rightTrigger = this.browserGamepad.buttons[7].value;
            this.buttonBack = this.browserGamepad.buttons[8].value;
            this.buttonStart = this.browserGamepad.buttons[9].value;
            this.buttonLeftStick = this.browserGamepad.buttons[10].value;
            this.buttonRightStick = this.browserGamepad.buttons[11].value;
            this.dPadUp = this.browserGamepad.buttons[12].value;
            this.dPadDown = this.browserGamepad.buttons[13].value;
            this.dPadLeft = this.browserGamepad.buttons[14].value;
            this.dPadRight = this.browserGamepad.buttons[15].value;
        }
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
//# sourceMappingURL=xboxGamepad.js.map