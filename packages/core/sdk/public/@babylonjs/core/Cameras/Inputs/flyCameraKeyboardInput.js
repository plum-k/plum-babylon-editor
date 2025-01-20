import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { KeyboardEventTypes } from "../../Events/keyboardEvents.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { Tools } from "../../Misc/tools.js";
/**
 * Listen to keyboard events to control the camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FlyCameraKeyboardInput {
    constructor() {
        /**
         * The list of keyboard keys used to control the forward move of the camera.
         */
        this.keysForward = [87];
        /**
         * The list of keyboard keys used to control the backward move of the camera.
         */
        this.keysBackward = [83];
        /**
         * The list of keyboard keys used to control the forward move of the camera.
         */
        this.keysUp = [69];
        /**
         * The list of keyboard keys used to control the backward move of the camera.
         */
        this.keysDown = [81];
        /**
         * The list of keyboard keys used to control the right strafe move of the camera.
         */
        this.keysRight = [68];
        /**
         * The list of keyboard keys used to control the left strafe move of the camera.
         */
        this.keysLeft = [65];
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
            if (info.type === KeyboardEventTypes.KEYDOWN) {
                if (this.keysForward.indexOf(evt.keyCode) !== -1 ||
                    this.keysBackward.indexOf(evt.keyCode) !== -1 ||
                    this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    const index = this._keys.indexOf(evt.keyCode);
                    if (index === -1) {
                        this._keys.push(evt.keyCode);
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            }
            else {
                if (this.keysForward.indexOf(evt.keyCode) !== -1 ||
                    this.keysBackward.indexOf(evt.keyCode) !== -1 ||
                    this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    const index = this._keys.indexOf(evt.keyCode);
                    if (index >= 0) {
                        this._keys.splice(index, 1);
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
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
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FlyCameraKeyboardInput";
    }
    /**
     * @internal
     */
    _onLostFocus() {
        this._keys.length = 0;
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "keyboard";
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this._onKeyboardObserver) {
            const camera = this.camera;
            // Keyboard
            for (let index = 0; index < this._keys.length; index++) {
                const keyCode = this._keys[index];
                const speed = camera._computeLocalCameraSpeed();
                if (this.keysForward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, speed);
                }
                else if (this.keysBackward.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, 0, -speed);
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, speed, 0);
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(0, -speed, 0);
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(speed, 0, 0);
                }
                else if (this.keysLeft.indexOf(keyCode) !== -1) {
                    camera._localDirection.copyFromFloats(-speed, 0, 0);
                }
                if (camera.getScene().useRightHandedSystem) {
                    camera._localDirection.z *= -1;
                }
                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                camera.cameraDirection.addInPlace(camera._transformedDirection);
            }
        }
    }
}
__decorate([
    serialize()
], FlyCameraKeyboardInput.prototype, "keysForward", void 0);
__decorate([
    serialize()
], FlyCameraKeyboardInput.prototype, "keysBackward", void 0);
__decorate([
    serialize()
], FlyCameraKeyboardInput.prototype, "keysUp", void 0);
__decorate([
    serialize()
], FlyCameraKeyboardInput.prototype, "keysDown", void 0);
__decorate([
    serialize()
], FlyCameraKeyboardInput.prototype, "keysRight", void 0);
__decorate([
    serialize()
], FlyCameraKeyboardInput.prototype, "keysLeft", void 0);
CameraInputTypes["FlyCameraKeyboardInput"] = FlyCameraKeyboardInput;
//# sourceMappingURL=flyCameraKeyboardInput.js.map