import { WebXRFeaturesManager, WebXRFeatureName } from "../webXRFeaturesManager.js";
import { WebXRControllerComponent } from "../motionController/webXRControllerComponent.js";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector.js";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature.js";
import { Tools } from "../../Misc/tools.js";
/**
 * This is a movement feature to be used with WebXR-enabled motion controllers.
 * When enabled and attached, the feature will allow a user to move around and rotate in the scene using
 * the input of the attached controllers.
 */
export class WebXRControllerMovement extends WebXRAbstractFeature {
    /**
     * Current movement direction.  Will be null before XR Frames have been processed.
     */
    get movementDirection() {
        return this._movementDirection;
    }
    /**
     * Is movement enabled
     */
    get movementEnabled() {
        return this._featureContext.movementEnabled;
    }
    /**
     * Sets whether movement is enabled or not
     * @param enabled is movement enabled
     */
    set movementEnabled(enabled) {
        this._featureContext.movementEnabled = enabled;
    }
    /**
     * If movement follows viewer pose
     */
    get movementOrientationFollowsViewerPose() {
        return this._featureContext.movementOrientationFollowsViewerPose;
    }
    /**
     * Sets whether movement follows viewer pose
     * @param followsPose is movement should follow viewer pose
     */
    set movementOrientationFollowsViewerPose(followsPose) {
        this._featureContext.movementOrientationFollowsViewerPose = followsPose;
    }
    /**
     * Gets movement speed
     */
    get movementSpeed() {
        return this._featureContext.movementSpeed;
    }
    /**
     * Sets movement speed
     * @param movementSpeed movement speed
     */
    set movementSpeed(movementSpeed) {
        this._featureContext.movementSpeed = movementSpeed;
    }
    /**
     * Gets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for movement (avoids jitter/unintentional movement)
     */
    get movementThreshold() {
        return this._featureContext.movementThreshold;
    }
    /**
     * Sets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for movement (avoids jitter/unintentional movement)
     * @param movementThreshold new threshold
     */
    set movementThreshold(movementThreshold) {
        this._featureContext.movementThreshold = movementThreshold;
    }
    /**
     * Is rotation enabled
     */
    get rotationEnabled() {
        return this._featureContext.rotationEnabled;
    }
    /**
     * Sets whether rotation is enabled or not
     * @param enabled is rotation enabled
     */
    set rotationEnabled(enabled) {
        this._featureContext.rotationEnabled = enabled;
    }
    /**
     * Gets rotation speed factor
     */
    get rotationSpeed() {
        return this._featureContext.rotationSpeed;
    }
    /**
     * Sets rotation speed factor (1.0 is default)
     * @param rotationSpeed new rotation speed factor
     */
    set rotationSpeed(rotationSpeed) {
        this._featureContext.rotationSpeed = rotationSpeed;
    }
    /**
     * Gets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for rotation (avoids jitter/unintentional rotation)
     */
    get rotationThreshold() {
        return this._featureContext.rotationThreshold;
    }
    /**
     * Sets minimum threshold the controller's thumbstick/touchpad must pass before being recognized for rotation (avoids jitter/unintentional rotation)
     * @param threshold new threshold
     */
    set rotationThreshold(threshold) {
        this._featureContext.rotationThreshold = threshold;
    }
    /**
     * constructs a new movement controller system
     * @param _xrSessionManager an instance of WebXRSessionManager
     * @param options configuration object for this feature
     */
    constructor(_xrSessionManager, options) {
        super(_xrSessionManager);
        this._controllers = {};
        this._currentRegistrationConfigurations = [];
        // forward direction for movement, which may differ from viewer pose.
        this._movementDirection = new Quaternion();
        // unused
        this._tmpRotationMatrix = Matrix.Identity();
        this._tmpTranslationDirection = new Vector3();
        this._tmpMovementTranslation = new Vector3();
        this._tempCacheQuaternion = new Quaternion();
        this._attachController = (xrController) => {
            if (this._controllers[xrController.uniqueId]) {
                // already attached
                return;
            }
            this._controllers[xrController.uniqueId] = {
                xrController,
                registeredComponents: [],
            };
            const controllerData = this._controllers[xrController.uniqueId];
            // movement controller only available to gamepad-enabled input sources.
            if (controllerData.xrController.inputSource.targetRayMode === "tracked-pointer" && controllerData.xrController.inputSource.gamepad) {
                // motion controller support
                const initController = () => {
                    if (xrController.motionController) {
                        for (const registration of this._currentRegistrationConfigurations) {
                            let component = null;
                            if (registration.allowedComponentTypes) {
                                for (const componentType of registration.allowedComponentTypes) {
                                    const componentOfType = xrController.motionController.getComponentOfType(componentType);
                                    if (componentOfType !== null) {
                                        component = componentOfType;
                                        break;
                                    }
                                }
                            }
                            if (registration.mainComponentOnly) {
                                const mainComponent = xrController.motionController.getMainComponent();
                                if (mainComponent === null) {
                                    continue;
                                }
                                component = mainComponent;
                            }
                            if (typeof registration.componentSelectionPredicate === "function") {
                                // if does not match we do want to ignore a previously found component
                                component = registration.componentSelectionPredicate(xrController);
                            }
                            if (component && registration.forceHandedness) {
                                if (xrController.inputSource.handedness !== registration.forceHandedness) {
                                    continue; // do not register
                                }
                            }
                            if (component === null) {
                                continue; // do not register
                            }
                            const registeredComponent = {
                                registrationConfiguration: registration,
                                component,
                            };
                            controllerData.registeredComponents.push(registeredComponent);
                            if ("axisChangedHandler" in registration) {
                                registeredComponent.onAxisChangedObserver = component.onAxisValueChangedObservable.add((axesData) => {
                                    registration.axisChangedHandler(axesData, this._movementState, this._featureContext, this._xrInput);
                                });
                            }
                            if ("buttonChangedHandler" in registration) {
                                registeredComponent.onButtonChangedObserver = component.onButtonStateChangedObservable.add((component) => {
                                    if (component.changes.pressed) {
                                        registration.buttonChangedHandler(component.changes.pressed, this._movementState, this._featureContext, this._xrInput);
                                    }
                                });
                            }
                        }
                    }
                };
                if (xrController.motionController) {
                    initController();
                }
                else {
                    xrController.onMotionControllerInitObservable.addOnce(() => {
                        initController();
                    });
                }
            }
        };
        if (!options || options.xrInput === undefined) {
            Tools.Error('WebXRControllerMovement feature requires "xrInput" option.');
            return;
        }
        if (Array.isArray(options.customRegistrationConfigurations)) {
            this._currentRegistrationConfigurations = options.customRegistrationConfigurations;
        }
        else {
            this._currentRegistrationConfigurations = WebXRControllerMovement.REGISTRATIONS.default;
        }
        // synchronized from feature setter properties
        this._featureContext = {
            movementEnabled: options.movementEnabled || true,
            movementOrientationFollowsViewerPose: options.movementOrientationFollowsViewerPose ?? true,
            movementOrientationFollowsController: options.movementOrientationFollowsController ?? false,
            orientationPreferredHandedness: options.orientationPreferredHandedness,
            movementSpeed: options.movementSpeed ?? 1,
            movementThreshold: options.movementThreshold ?? 0.25,
            rotationEnabled: options.rotationEnabled ?? true,
            rotationSpeed: options.rotationSpeed ?? 1.0,
            rotationThreshold: options.rotationThreshold ?? 0.25,
        };
        this._movementState = {
            moveX: 0,
            moveY: 0,
            rotateX: 0,
            rotateY: 0,
        };
        this._xrInput = options.xrInput;
    }
    attach() {
        if (!super.attach()) {
            return false;
        }
        this._xrInput.controllers.forEach(this._attachController);
        this._addNewAttachObserver(this._xrInput.onControllerAddedObservable, this._attachController);
        this._addNewAttachObserver(this._xrInput.onControllerRemovedObservable, (controller) => {
            // REMOVE the controller
            this._detachController(controller.uniqueId);
        });
        return true;
    }
    detach() {
        if (!super.detach()) {
            return false;
        }
        Object.keys(this._controllers).forEach((controllerId) => {
            this._detachController(controllerId);
        });
        this._controllers = {};
        return true;
    }
    /**
     * Occurs on every XR frame.
     * @param _xrFrame
     */
    _onXRFrame(_xrFrame) {
        if (!this.attached) {
            return;
        }
        if (this._movementState.rotateX !== 0 && this._featureContext.rotationEnabled) {
            // smooth rotation
            const deltaMillis = this._xrSessionManager.scene.getEngine().getDeltaTime();
            const rotationY = deltaMillis * 0.001 * this._featureContext.rotationSpeed * this._movementState.rotateX * (this._xrSessionManager.scene.useRightHandedSystem ? -1 : 1);
            if (this._featureContext.movementOrientationFollowsViewerPose) {
                this._xrInput.xrCamera.cameraRotation.y += rotationY;
                Quaternion.RotationYawPitchRollToRef(rotationY, 0, 0, this._tempCacheQuaternion);
                this._xrInput.xrCamera.rotationQuaternion.multiplyToRef(this._tempCacheQuaternion, this._movementDirection);
            }
            else if (this._featureContext.movementOrientationFollowsController) {
                this._xrInput.xrCamera.cameraRotation.y += rotationY;
                // get the correct controller
                const handedness = this._featureContext.orientationPreferredHandedness || "right";
                const key = Object.keys(this._controllers).find((key) => this._controllers[key]?.xrController?.inputSource.handedness === handedness) || Object.keys(this._controllers)[0];
                const controller = this._controllers[key];
                Quaternion.RotationYawPitchRollToRef(rotationY, 0, 0, this._tempCacheQuaternion);
                (controller?.xrController.pointer.rotationQuaternion || Quaternion.Identity()).multiplyToRef(this._tempCacheQuaternion, this._movementDirection);
            }
            else {
                // movement orientation direction does not affect camera.  We use rotation speed multiplier
                // otherwise need to implement inertia and constraints for same feel as TargetCamera.
                Quaternion.RotationYawPitchRollToRef(rotationY * 3.0, 0, 0, this._tempCacheQuaternion);
                this._movementDirection.multiplyInPlace(this._tempCacheQuaternion);
            }
        }
        else if (this._featureContext.movementOrientationFollowsViewerPose) {
            this._movementDirection.copyFrom(this._xrInput.xrCamera.rotationQuaternion);
        }
        else if (this._featureContext.movementOrientationFollowsController) {
            // get the correct controller
            const handedness = this._featureContext.orientationPreferredHandedness || "right";
            const key = Object.keys(this._controllers).find((key) => this._controllers[key]?.xrController.inputSource.handedness === handedness) || Object.keys(this._controllers)[0];
            const controller = this._controllers[key];
            this._movementDirection.copyFrom(controller?.xrController.pointer.rotationQuaternion || Quaternion.Identity());
        }
        if ((this._movementState.moveX || this._movementState.moveY) && this._featureContext.movementEnabled) {
            Matrix.FromQuaternionToRef(this._movementDirection, this._tmpRotationMatrix);
            this._tmpTranslationDirection.set(this._movementState.moveX, 0, this._movementState.moveY * (this._xrSessionManager.scene.useRightHandedSystem ? 1.0 : -1.0));
            // move according to forward direction based on camera speed
            Vector3.TransformCoordinatesToRef(this._tmpTranslationDirection, this._tmpRotationMatrix, this._tmpMovementTranslation);
            this._tmpMovementTranslation.scaleInPlace(this._xrInput.xrCamera._computeLocalCameraSpeed() * this._featureContext.movementSpeed);
            this._xrInput.xrCamera.cameraDirection.addInPlace(this._tmpMovementTranslation);
        }
    }
    _detachController(xrControllerUniqueId) {
        const controllerData = this._controllers[xrControllerUniqueId];
        if (!controllerData) {
            return;
        }
        for (const registeredComponent of controllerData.registeredComponents) {
            if (registeredComponent.onAxisChangedObserver) {
                registeredComponent.component.onAxisValueChangedObservable.remove(registeredComponent.onAxisChangedObserver);
            }
            if (registeredComponent.onButtonChangedObserver) {
                registeredComponent.component.onButtonStateChangedObservable.remove(registeredComponent.onButtonChangedObserver);
            }
        }
        // remove from the map
        delete this._controllers[xrControllerUniqueId];
    }
}
/**
 * The module's name
 */
WebXRControllerMovement.Name = WebXRFeatureName.MOVEMENT;
/**
 * Standard controller configurations.
 */
WebXRControllerMovement.REGISTRATIONS = {
    default: [
        {
            allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
            forceHandedness: "left",
            axisChangedHandler: (axes, movementState, featureContext) => {
                movementState.rotateX = Math.abs(axes.x) > featureContext.rotationThreshold ? axes.x : 0;
                movementState.rotateY = Math.abs(axes.y) > featureContext.rotationThreshold ? axes.y : 0;
            },
        },
        {
            allowedComponentTypes: [WebXRControllerComponent.THUMBSTICK_TYPE, WebXRControllerComponent.TOUCHPAD_TYPE],
            forceHandedness: "right",
            axisChangedHandler: (axes, movementState, featureContext) => {
                movementState.moveX = Math.abs(axes.x) > featureContext.movementThreshold ? axes.x : 0;
                movementState.moveY = Math.abs(axes.y) > featureContext.movementThreshold ? axes.y : 0;
            },
        },
    ],
};
/**
 * The (Babylon) version of this module.
 * This is an integer representing the implementation version.
 * This number does not correspond to the webxr specs version
 */
WebXRControllerMovement.Version = 1;
WebXRFeaturesManager.AddWebXRFeature(WebXRControllerMovement.Name, (xrSessionManager, options) => {
    return () => new WebXRControllerMovement(xrSessionManager, options);
}, WebXRControllerMovement.Version, true);
//# sourceMappingURL=WebXRControllerMovement.js.map