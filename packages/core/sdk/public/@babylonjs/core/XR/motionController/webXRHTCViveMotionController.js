import { WebXRAbstractMotionController } from "./webXRAbstractMotionController.js";
import { Mesh } from "../../Meshes/mesh.js";
import { Quaternion } from "../../Maths/math.vector.js";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager.js";
/**
 * The motion controller class for the standard HTC-Vive controllers
 */
export class WebXRHTCViveMotionController extends WebXRAbstractMotionController {
    /**
     * Create a new Vive motion controller object
     * @param scene the scene to use to create this controller
     * @param gamepadObject the corresponding gamepad object
     * @param handedness the handedness of the controller
     */
    constructor(scene, gamepadObject, handedness) {
        super(scene, HTCViveLayout[handedness], gamepadObject, handedness);
        this.profileId = "htc-vive";
    }
    _getFilenameAndPath() {
        const filename = WebXRHTCViveMotionController.MODEL_FILENAME;
        const path = WebXRHTCViveMotionController.MODEL_BASE_URL;
        return {
            filename,
            path,
        };
    }
    _getModelLoadingConstraints() {
        return true;
    }
    _processLoadedModel(_meshes) {
        this.getComponentIds().forEach((id) => {
            const comp = id && this.getComponent(id);
            if (comp) {
                comp.onButtonStateChangedObservable.add((component) => {
                    if (!this.rootMesh || this.disableAnimation) {
                        return;
                    }
                    switch (id) {
                        case "xr-standard-trigger":
                            this._modelRootNode.getChildren()[6].rotation.x = -component.value * 0.15;
                            return;
                        case "xr-standard-touchpad":
                            return;
                        case "xr-standard-squeeze":
                            return;
                    }
                }, undefined, true);
            }
        });
    }
    _setRootMesh(meshes) {
        this.rootMesh = new Mesh(this.profileId + " " + this.handedness, this.scene);
        meshes.forEach((mesh) => {
            mesh.isPickable = false;
        });
        this._modelRootNode = meshes[1];
        this._modelRootNode.parent = this.rootMesh;
        if (!this.scene.useRightHandedSystem) {
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
        }
    }
    _updateModel() {
        // no-op. model is updated using observables.
    }
}
/**
 * The base url used to load the left and right controller models
 */
WebXRHTCViveMotionController.MODEL_BASE_URL = "https://controllers.babylonjs.com/vive/";
/**
 * File name for the controller model.
 */
WebXRHTCViveMotionController.MODEL_FILENAME = "wand.babylon";
// register the profile
WebXRMotionControllerManager.RegisterController("htc-vive", (xrInput, scene) => {
    return new WebXRHTCViveMotionController(scene, xrInput.gamepad, xrInput.handedness);
});
// WebXRMotionControllerManager.RegisterController("htc-vive-legacy", (xrInput: XRInputSource, scene: Scene) => {
//     return new WebXRHTCViveMotionController(scene, <any>(xrInput.gamepad), xrInput.handedness, true);
// });
const HTCViveLayout = {
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
            "xr-standard-touchpad": {
                type: "touchpad",
                gamepadIndices: {
                    button: 2,
                    xAxis: 0,
                    yAxis: 1,
                },
                rootNodeName: "xr_standard_touchpad",
                visualResponses: {},
            },
            menu: {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "menu",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "htc_vive_none",
        assetPath: "none.glb",
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
            "xr-standard-touchpad": {
                type: "touchpad",
                gamepadIndices: {
                    button: 2,
                    xAxis: 0,
                    yAxis: 1,
                },
                rootNodeName: "xr_standard_touchpad",
                visualResponses: {},
            },
            menu: {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "menu",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "htc_vive_none",
        assetPath: "none.glb",
    },
    none: {
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
            "xr-standard-touchpad": {
                type: "touchpad",
                gamepadIndices: {
                    button: 2,
                    xAxis: 0,
                    yAxis: 1,
                },
                rootNodeName: "xr_standard_touchpad",
                visualResponses: {},
            },
            menu: {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "menu",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "htc-vive-none",
        assetPath: "none.glb",
    },
};
//# sourceMappingURL=webXRHTCViveMotionController.js.map