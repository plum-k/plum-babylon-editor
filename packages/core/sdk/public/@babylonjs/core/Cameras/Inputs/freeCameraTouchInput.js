import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { PointerEventTypes } from "../../Events/pointerEvents.js";
import { Matrix, Vector3 } from "../../Maths/math.vector.js";
import { Tools } from "../../Misc/tools.js";
/**
 * Manage the touch inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraTouchInput {
    /**
     * Manage the touch inputs to control the movement of a free camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
     * @param allowMouse Defines if mouse events can be treated as touch events
     */
    constructor(
    /**
     * [false] Define if mouse events can be treated as touch events
     */
    allowMouse = false) {
        this.allowMouse = allowMouse;
        /**
         * Defines the touch sensibility for rotation.
         * The lower the faster.
         */
        this.touchAngularSensibility = 200000.0;
        /**
         * Defines the touch sensibility for move.
         * The lower the faster.
         */
        this.touchMoveSensibility = 250.0;
        /**
         * Swap touch actions so that one touch is used for rotation and multiple for movement
         */
        this.singleFingerRotate = false;
        this._offsetX = null;
        this._offsetY = null;
        this._pointerPressed = new Array();
        this._isSafari = Tools.IsSafari();
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(noPreventDefault) {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        let previousPosition = null;
        if (this._pointerInput === undefined) {
            this._onLostFocus = () => {
                this._offsetX = null;
                this._offsetY = null;
            };
            this._pointerInput = (p) => {
                const evt = p.event;
                const isMouseEvent = evt.pointerType === "mouse" || (this._isSafari && typeof evt.pointerType === "undefined");
                if (!this.allowMouse && isMouseEvent) {
                    return;
                }
                if (p.type === PointerEventTypes.POINTERDOWN) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    this._pointerPressed.push(evt.pointerId);
                    if (this._pointerPressed.length !== 1) {
                        return;
                    }
                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY,
                    };
                }
                else if (p.type === PointerEventTypes.POINTERUP) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    const index = this._pointerPressed.indexOf(evt.pointerId);
                    if (index === -1) {
                        return;
                    }
                    this._pointerPressed.splice(index, 1);
                    if (index != 0) {
                        return;
                    }
                    previousPosition = null;
                    this._offsetX = null;
                    this._offsetY = null;
                }
                else if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    if (!previousPosition) {
                        return;
                    }
                    const index = this._pointerPressed.indexOf(evt.pointerId);
                    if (index != 0) {
                        return;
                    }
                    this._offsetX = evt.clientX - previousPosition.x;
                    this._offsetY = -(evt.clientY - previousPosition.y);
                }
            };
        }
        this._observer = this.camera
            .getScene()
            ._inputManager._addCameraPointerObserver(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);
        if (this._onLostFocus) {
            const engine = this.camera.getEngine();
            const element = engine.getInputElement();
            element && element.addEventListener("blur", this._onLostFocus);
        }
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        if (this._pointerInput) {
            if (this._observer) {
                this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);
                this._observer = null;
            }
            if (this._onLostFocus) {
                const engine = this.camera.getEngine();
                const element = engine.getInputElement();
                element && element.removeEventListener("blur", this._onLostFocus);
                this._onLostFocus = null;
            }
            this._pointerPressed.length = 0;
            this._offsetX = null;
            this._offsetY = null;
        }
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this._offsetX === null || this._offsetY === null) {
            return;
        }
        if (this._offsetX === 0 && this._offsetY === 0) {
            return;
        }
        const camera = this.camera;
        const handednessMultiplier = camera._calculateHandednessMultiplier();
        camera.cameraRotation.y = (handednessMultiplier * this._offsetX) / this.touchAngularSensibility;
        const rotateCamera = (this.singleFingerRotate && this._pointerPressed.length === 1) || (!this.singleFingerRotate && this._pointerPressed.length > 1);
        if (rotateCamera) {
            camera.cameraRotation.x = -this._offsetY / this.touchAngularSensibility;
        }
        else {
            const speed = camera._computeLocalCameraSpeed();
            const direction = new Vector3(0, 0, this.touchMoveSensibility !== 0 ? (speed * this._offsetY) / this.touchMoveSensibility : 0);
            Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
            camera.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
        }
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FreeCameraTouchInput";
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "touch";
    }
}
__decorate([
    serialize()
], FreeCameraTouchInput.prototype, "touchAngularSensibility", void 0);
__decorate([
    serialize()
], FreeCameraTouchInput.prototype, "touchMoveSensibility", void 0);
CameraInputTypes["FreeCameraTouchInput"] = FreeCameraTouchInput;
//# sourceMappingURL=freeCameraTouchInput.js.map