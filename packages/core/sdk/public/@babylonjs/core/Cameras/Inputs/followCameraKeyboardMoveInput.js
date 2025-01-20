import { __decorate } from "../../tslib.es6.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { serialize } from "../../Misc/decorators.js";
import { KeyboardEventTypes } from "../../Events/keyboardEvents.js";
import { Tools } from "../../Misc/tools.js";
/**
 * Manage the keyboard inputs to control the movement of a follow camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FollowCameraKeyboardMoveInput {
    constructor() {
        /**
         * Defines the list of key codes associated with the up action (increase heightOffset)
         */
        this.keysHeightOffsetIncr = [38];
        /**
         * Defines the list of key codes associated with the down action (decrease heightOffset)
         */
        this.keysHeightOffsetDecr = [40];
        /**
         * Defines whether the Alt modifier key is required to move up/down (alter heightOffset)
         */
        this.keysHeightOffsetModifierAlt = false;
        /**
         * Defines whether the Ctrl modifier key is required to move up/down (alter heightOffset)
         */
        this.keysHeightOffsetModifierCtrl = false;
        /**
         * Defines whether the Shift modifier key is required to move up/down (alter heightOffset)
         */
        this.keysHeightOffsetModifierShift = false;
        /**
         * Defines the list of key codes associated with the left action (increase rotationOffset)
         */
        this.keysRotationOffsetIncr = [37];
        /**
         * Defines the list of key codes associated with the right action (decrease rotationOffset)
         */
        this.keysRotationOffsetDecr = [39];
        /**
         * Defines whether the Alt modifier key is required to move left/right (alter rotationOffset)
         */
        this.keysRotationOffsetModifierAlt = false;
        /**
         * Defines whether the Ctrl modifier key is required to move left/right (alter rotationOffset)
         */
        this.keysRotationOffsetModifierCtrl = false;
        /**
         * Defines whether the Shift modifier key is required to move left/right (alter rotationOffset)
         */
        this.keysRotationOffsetModifierShift = false;
        /**
         * Defines the list of key codes associated with the zoom-in action (decrease radius)
         */
        this.keysRadiusIncr = [40];
        /**
         * Defines the list of key codes associated with the zoom-out action (increase radius)
         */
        this.keysRadiusDecr = [38];
        /**
         * Defines whether the Alt modifier key is required to zoom in/out (alter radius value)
         */
        this.keysRadiusModifierAlt = true;
        /**
         * Defines whether the Ctrl modifier key is required to zoom in/out (alter radius value)
         */
        this.keysRadiusModifierCtrl = false;
        /**
         * Defines whether the Shift modifier key is required to zoom in/out (alter radius value)
         */
        this.keysRadiusModifierShift = false;
        /**
         * Defines the rate of change of heightOffset.
         */
        this.heightSensibility = 1;
        /**
         * Defines the rate of change of rotationOffset.
         */
        this.rotationSensibility = 1;
        /**
         * Defines the rate of change of radius.
         */
        this.radiusSensibility = 1;
        this._keys = new Array();
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(noPreventDefault) {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        if (this._onCanvasBlurObserver) {
            return;
        }
        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();
        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
            this._keys.length = 0;
        });
        this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => {
            const evt = info.event;
            if (!evt.metaKey) {
                if (info.type === KeyboardEventTypes.KEYDOWN) {
                    this._ctrlPressed = evt.ctrlKey;
                    this._altPressed = evt.altKey;
                    this._shiftPressed = evt.shiftKey;
                    if (this.keysHeightOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysHeightOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusDecr.indexOf(evt.keyCode) !== -1) {
                        const index = this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            this._keys.push(evt.keyCode);
                        }
                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                }
                else {
                    if (this.keysHeightOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysHeightOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotationOffsetDecr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusIncr.indexOf(evt.keyCode) !== -1 ||
                        this.keysRadiusDecr.indexOf(evt.keyCode) !== -1) {
                        const index = this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            this._keys.splice(index, 1);
                        }
                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        if (this._scene) {
            if (this._onKeyboardObserver) {
                this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
            }
            if (this._onCanvasBlurObserver) {
                this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }
            this._onKeyboardObserver = null;
            this._onCanvasBlurObserver = null;
        }
        this._keys.length = 0;
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this._onKeyboardObserver) {
            this._keys.forEach((keyCode) => {
                if (this.keysHeightOffsetIncr.indexOf(keyCode) !== -1 && this._modifierHeightOffset()) {
                    this.camera.heightOffset += this.heightSensibility;
                }
                else if (this.keysHeightOffsetDecr.indexOf(keyCode) !== -1 && this._modifierHeightOffset()) {
                    this.camera.heightOffset -= this.heightSensibility;
                }
                else if (this.keysRotationOffsetIncr.indexOf(keyCode) !== -1 && this._modifierRotationOffset()) {
                    this.camera.rotationOffset += this.rotationSensibility;
                    this.camera.rotationOffset %= 360;
                }
                else if (this.keysRotationOffsetDecr.indexOf(keyCode) !== -1 && this._modifierRotationOffset()) {
                    this.camera.rotationOffset -= this.rotationSensibility;
                    this.camera.rotationOffset %= 360;
                }
                else if (this.keysRadiusIncr.indexOf(keyCode) !== -1 && this._modifierRadius()) {
                    this.camera.radius += this.radiusSensibility;
                }
                else if (this.keysRadiusDecr.indexOf(keyCode) !== -1 && this._modifierRadius()) {
                    this.camera.radius -= this.radiusSensibility;
                }
            });
        }
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FollowCameraKeyboardMoveInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "keyboard";
    }
    /**
     * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
     * allow modification of the heightOffset value.
     * @returns true if modifier keys match
     */
    _modifierHeightOffset() {
        return (this.keysHeightOffsetModifierAlt === this._altPressed &&
            this.keysHeightOffsetModifierCtrl === this._ctrlPressed &&
            this.keysHeightOffsetModifierShift === this._shiftPressed);
    }
    /**
     * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
     * allow modification of the rotationOffset value.
     * @returns true if modifier keys match
     */
    _modifierRotationOffset() {
        return (this.keysRotationOffsetModifierAlt === this._altPressed &&
            this.keysRotationOffsetModifierCtrl === this._ctrlPressed &&
            this.keysRotationOffsetModifierShift === this._shiftPressed);
    }
    /**
     * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
     * allow modification of the radius value.
     * @returns true if modifier keys match
     */
    _modifierRadius() {
        return this.keysRadiusModifierAlt === this._altPressed && this.keysRadiusModifierCtrl === this._ctrlPressed && this.keysRadiusModifierShift === this._shiftPressed;
    }
}
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysHeightOffsetIncr", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysHeightOffsetDecr", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysHeightOffsetModifierAlt", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysHeightOffsetModifierCtrl", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysHeightOffsetModifierShift", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRotationOffsetIncr", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRotationOffsetDecr", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRotationOffsetModifierAlt", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRotationOffsetModifierCtrl", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRotationOffsetModifierShift", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRadiusIncr", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRadiusDecr", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRadiusModifierAlt", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRadiusModifierCtrl", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "keysRadiusModifierShift", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "heightSensibility", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "rotationSensibility", void 0);
__decorate([
    serialize()
], FollowCameraKeyboardMoveInput.prototype, "radiusSensibility", void 0);
CameraInputTypes["FollowCameraKeyboardMoveInput"] = FollowCameraKeyboardMoveInput;
//# sourceMappingURL=followCameraKeyboardMoveInput.js.map