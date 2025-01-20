import { WebXRAbstractMotionController } from "./webXRAbstractMotionController.js";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager.js";
import { Mesh } from "../../Meshes/mesh.js";
import { Quaternion } from "../../Maths/math.vector.js";
/**
 * The motion controller class for oculus touch (quest, rift).
 * This class supports legacy mapping as well the standard xr mapping
 */
export class WebXROculusTouchMotionController extends WebXRAbstractMotionController {
    constructor(scene, gamepadObject, handedness, _legacyMapping = false, _forceLegacyControllers = false) {
        super(scene, OculusTouchLayouts[handedness], gamepadObject, handedness);
        this._forceLegacyControllers = _forceLegacyControllers;
        this.profileId = "oculus-touch";
    }
    _getFilenameAndPath() {
        let filename = "";
        if (this.handedness === "left") {
            filename = WebXROculusTouchMotionController.MODEL_LEFT_FILENAME;
        }
        else {
            // Right is the default if no hand is specified
            filename = WebXROculusTouchMotionController.MODEL_RIGHT_FILENAME;
        }
        const path = this._isQuest() ? WebXROculusTouchMotionController.QUEST_MODEL_BASE_URL : WebXROculusTouchMotionController.MODEL_BASE_URL;
        return {
            filename,
            path,
        };
    }
    _getModelLoadingConstraints() {
        return true;
    }
    _processLoadedModel(_meshes) {
        const isQuest = this._isQuest();
        const triggerDirection = this.handedness === "right" ? -1 : 1;
        this.getComponentIds().forEach((id) => {
            const comp = id && this.getComponent(id);
            if (comp) {
                comp.onButtonStateChangedObservable.add((component) => {
                    if (!this.rootMesh || this.disableAnimation) {
                        return;
                    }
                    switch (id) {
                        case "xr-standard-trigger": // index trigger
                            if (!isQuest) {
                                this._modelRootNode.getChildren()[3].rotation.x = -component.value * 0.2;
                                this._modelRootNode.getChildren()[3].position.y = -component.value * 0.005;
                                this._modelRootNode.getChildren()[3].position.z = -component.value * 0.005;
                            }
                            return;
                        case "xr-standard-squeeze": // secondary trigger
                            if (!isQuest) {
                                this._modelRootNode.getChildren()[4].position.x = triggerDirection * component.value * 0.0035;
                            }
                            return;
                        case "xr-standard-thumbstick": // thumbstick
                            return;
                        case "a-button":
                        case "x-button":
                            if (!isQuest) {
                                if (component.pressed) {
                                    this._modelRootNode.getChildren()[1].position.y = -0.001;
                                }
                                else {
                                    this._modelRootNode.getChildren()[1].position.y = 0;
                                }
                            }
                            return;
                        case "b-button":
                        case "y-button":
                            if (!isQuest) {
                                if (component.pressed) {
                                    this._modelRootNode.getChildren()[2].position.y = -0.001;
                                }
                                else {
                                    this._modelRootNode.getChildren()[2].position.y = 0;
                                }
                            }
                            return;
                    }
                }, undefined, true);
            }
        });
    }
    _setRootMesh(meshes) {
        this.rootMesh = new Mesh(this.profileId + " " + this.handedness, this.scene);
        if (!this.scene.useRightHandedSystem) {
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
        }
        meshes.forEach((mesh) => {
            mesh.isPickable = false;
        });
        if (this._isQuest()) {
            this._modelRootNode = meshes[0];
        }
        else {
            this._modelRootNode = meshes[1];
            this.rootMesh.position.y = 0.034;
            this.rootMesh.position.z = 0.052;
        }
        this._modelRootNode.parent = this.rootMesh;
    }
    _updateModel() {
        // no-op. model is updated using observables.
    }
    /**
     * Is this the new type of oculus touch. At the moment both have the same profile and it is impossible to differentiate
     * between the touch and touch 2.
     * @returns true if this is the new type of oculus touch controllers.
     */
    _isQuest() {
        // this is SADLY the only way to currently check. Until proper profiles will be available.
        return !!navigator.userAgent.match(/Quest/gi) && !this._forceLegacyControllers;
    }
}
/**
 * The base url used to load the left and right controller models
 */
WebXROculusTouchMotionController.MODEL_BASE_URL = "https://controllers.babylonjs.com/oculus/";
/**
 * The name of the left controller model file
 */
WebXROculusTouchMotionController.MODEL_LEFT_FILENAME = "left.babylon";
/**
 * The name of the right controller model file
 */
WebXROculusTouchMotionController.MODEL_RIGHT_FILENAME = "right.babylon";
/**
 * Base Url for the Quest controller model.
 */
WebXROculusTouchMotionController.QUEST_MODEL_BASE_URL = "https://controllers.babylonjs.com/oculusQuest/";
// register the profile
WebXRMotionControllerManager.RegisterController("oculus-touch", (xrInput, scene) => {
    return new WebXROculusTouchMotionController(scene, xrInput.gamepad, xrInput.handedness);
});
WebXRMotionControllerManager.RegisterController("oculus-touch-legacy", (xrInput, scene) => {
    return new WebXROculusTouchMotionController(scene, xrInput.gamepad, xrInput.handedness, true);
});
const OculusTouchLayouts = {
    left: {
        selectComponentId: "xr-standard-trigger",
        components: {
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
            "xr-standard-squeeze": {
                type: "squeeze",
                gamepadIndices: {
                    button: 1,
                },
                rootNodeName: "xr_standard_squeeze",
                visualResponses: {},
            },
            "xr-standard-thumbstick": {
                type: "thumbstick",
                gamepadIndices: {
                    button: 3,
                    xAxis: 2,
                    yAxis: 3,
                },
                rootNodeName: "xr_standard_thumbstick",
                visualResponses: {},
            },
            "x-button": {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "x_button",
                visualResponses: {},
            },
            "y-button": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "y_button",
                visualResponses: {},
            },
            thumbrest: {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "thumbrest",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-touch-v2-left",
        assetPath: "left.glb",
    },
    right: {
        selectComponentId: "xr-standard-trigger",
        components: {
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
            "xr-standard-squeeze": {
                type: "squeeze",
                gamepadIndices: {
                    button: 1,
                },
                rootNodeName: "xr_standard_squeeze",
                visualResponses: {},
            },
            "xr-standard-thumbstick": {
                type: "thumbstick",
                gamepadIndices: {
                    button: 3,
                    xAxis: 2,
                    yAxis: 3,
                },
                rootNodeName: "xr_standard_thumbstick",
                visualResponses: {},
            },
            "a-button": {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "a_button",
                visualResponses: {},
            },
            "b-button": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "b_button",
                visualResponses: {},
            },
            thumbrest: {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "thumbrest",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-touch-v2-right",
        assetPath: "right.glb",
    },
};
//# sourceMappingURL=webXROculusTouchMotionController.js.map