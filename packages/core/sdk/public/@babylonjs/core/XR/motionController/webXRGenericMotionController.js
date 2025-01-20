import { WebXRAbstractMotionController } from "./webXRAbstractMotionController.js";
import { Mesh } from "../../Meshes/mesh.js";
import { Quaternion } from "../../Maths/math.vector.js";
/**
 * A generic trigger-only motion controller for WebXR
 */
export class WebXRGenericTriggerMotionController extends WebXRAbstractMotionController {
    constructor(scene, gamepadObject, handedness) {
        super(scene, GenericTriggerLayout[handedness], gamepadObject, handedness);
        this.profileId = WebXRGenericTriggerMotionController.ProfileId;
    }
    _getFilenameAndPath() {
        return {
            filename: "generic.babylon",
            path: "https://controllers.babylonjs.com/generic/",
        };
    }
    _getModelLoadingConstraints() {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _processLoadedModel(meshes) {
        // nothing to do
    }
    _setRootMesh(meshes) {
        this.rootMesh = new Mesh(this.profileId + " " + this.handedness, this.scene);
        meshes.forEach((mesh) => {
            mesh.isPickable = false;
            if (!mesh.parent) {
                mesh.setParent(this.rootMesh);
            }
        });
        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }
    _updateModel() {
        // no-op
    }
}
/**
 * Static version of the profile id of this controller
 */
WebXRGenericTriggerMotionController.ProfileId = "generic-trigger";
// https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/generic/generic-trigger-touchpad-thumbstick.json
const GenericTriggerLayout = {
    left: {
        selectComponentId: "xr-standard-trigger",
        components: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "generic-trigger-left",
        assetPath: "left.glb",
    },
    right: {
        selectComponentId: "xr-standard-trigger",
        components: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "generic-trigger-right",
        assetPath: "right.glb",
    },
    none: {
        selectComponentId: "xr-standard-trigger",
        components: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "generic-trigger-none",
        assetPath: "none.glb",
    },
};
//# sourceMappingURL=webXRGenericMotionController.js.map