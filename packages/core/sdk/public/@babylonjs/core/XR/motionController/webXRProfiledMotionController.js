import { WebXRAbstractMotionController } from "./webXRAbstractMotionController.js";
import { SceneLoader } from "../../Loading/sceneLoader.js";
import { Mesh } from "../../Meshes/mesh.js";
import { Axis } from "../../Maths/math.axis.js";
import { Color3 } from "../../Maths/math.color.js";
import { WebXRControllerComponent } from "./webXRControllerComponent.js";
import { CreateSphere } from "../../Meshes/Builders/sphereBuilder.js";
import { StandardMaterial } from "../../Materials/standardMaterial.js";
import { Logger } from "../../Misc/logger.js";
/**
 * A profiled motion controller has its profile loaded from an online repository.
 * The class is responsible of loading the model, mapping the keys and enabling model-animations
 */
export class WebXRProfiledMotionController extends WebXRAbstractMotionController {
    constructor(scene, xrInput, _profile, _repositoryUrl, 
    // eslint-disable-next-line @typescript-eslint/naming-convention
    controllerCache) {
        super(scene, _profile.layouts[xrInput.handedness || "none"], xrInput.gamepad, xrInput.handedness, undefined, controllerCache);
        this._repositoryUrl = _repositoryUrl;
        this.controllerCache = controllerCache;
        this._buttonMeshMapping = {};
        this._touchDots = {};
        this.profileId = _profile.profileId;
    }
    dispose() {
        super.dispose();
        if (!this.controllerCache) {
            Object.keys(this._touchDots).forEach((visResKey) => {
                this._touchDots[visResKey].dispose();
            });
        }
    }
    _getFilenameAndPath() {
        return {
            filename: this.layout.assetPath,
            path: `${this._repositoryUrl}/profiles/${this.profileId}/`,
        };
    }
    _getModelLoadingConstraints() {
        const glbLoaded = SceneLoader.IsPluginForExtensionAvailable(".glb");
        if (!glbLoaded) {
            Logger.Warn("glTF / glb loader was not registered, using generic controller instead");
        }
        return glbLoaded;
    }
    _processLoadedModel(_meshes) {
        this.getComponentIds().forEach((type) => {
            const componentInLayout = this.layout.components[type];
            this._buttonMeshMapping[type] = {
                mainMesh: this._getChildByName(this.rootMesh, componentInLayout.rootNodeName),
                states: {},
            };
            Object.keys(componentInLayout.visualResponses).forEach((visualResponseKey) => {
                const visResponse = componentInLayout.visualResponses[visualResponseKey];
                if (visResponse.valueNodeProperty === "transform") {
                    this._buttonMeshMapping[type].states[visualResponseKey] = {
                        valueMesh: this._getChildByName(this.rootMesh, visResponse.valueNodeName),
                        minMesh: this._getChildByName(this.rootMesh, visResponse.minNodeName),
                        maxMesh: this._getChildByName(this.rootMesh, visResponse.maxNodeName),
                    };
                }
                else {
                    // visibility, usually for touchpads
                    const nameOfMesh = componentInLayout.type === WebXRControllerComponent.TOUCHPAD_TYPE && componentInLayout.touchPointNodeName
                        ? componentInLayout.touchPointNodeName
                        : visResponse.valueNodeName;
                    this._buttonMeshMapping[type].states[visualResponseKey] = {
                        valueMesh: this._getChildByName(this.rootMesh, nameOfMesh),
                    };
                    if (componentInLayout.type === WebXRControllerComponent.TOUCHPAD_TYPE && !this._touchDots[visualResponseKey]) {
                        const dot = CreateSphere(visualResponseKey + "dot", {
                            diameter: 0.0015,
                            segments: 8,
                        }, this.scene);
                        dot.material = new StandardMaterial(visualResponseKey + "mat", this.scene);
                        dot.material.diffuseColor = Color3.Red();
                        dot.parent = this._buttonMeshMapping[type].states[visualResponseKey].valueMesh || null;
                        dot.isVisible = false;
                        this._touchDots[visualResponseKey] = dot;
                    }
                }
            });
        });
    }
    _setRootMesh(meshes) {
        this.rootMesh = new Mesh(this.profileId + "-" + this.handedness, this.scene);
        this.rootMesh.isPickable = false;
        let rootMesh;
        // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            mesh.isPickable = false;
            if (!mesh.parent) {
                // Handle root node, attach to the new parentMesh
                rootMesh = mesh;
            }
        }
        if (rootMesh) {
            rootMesh.setParent(this.rootMesh);
        }
        if (!this.scene.useRightHandedSystem) {
            this.rootMesh.rotate(Axis.Y, Math.PI, 1 /* Space.WORLD */);
        }
    }
    _updateModel(_xrFrame) {
        if (this.disableAnimation) {
            return;
        }
        this.getComponentIds().forEach((id) => {
            const component = this.getComponent(id);
            if (!component.hasChanges) {
                return;
            }
            const meshes = this._buttonMeshMapping[id];
            const componentInLayout = this.layout.components[id];
            Object.keys(componentInLayout.visualResponses).forEach((visualResponseKey) => {
                const visResponse = componentInLayout.visualResponses[visualResponseKey];
                let value = component.value;
                if (visResponse.componentProperty === "xAxis") {
                    value = component.axes.x;
                }
                else if (visResponse.componentProperty === "yAxis") {
                    value = component.axes.y;
                }
                if (visResponse.valueNodeProperty === "transform") {
                    this._lerpTransform(meshes.states[visualResponseKey], value, visResponse.componentProperty !== "button");
                }
                else {
                    // visibility
                    const valueMesh = meshes.states[visualResponseKey].valueMesh;
                    if (valueMesh) {
                        valueMesh.isVisible = component.touched || component.pressed;
                    }
                    if (this._touchDots[visualResponseKey]) {
                        this._touchDots[visualResponseKey].isVisible = component.touched || component.pressed;
                    }
                }
            });
        });
    }
}
//# sourceMappingURL=webXRProfiledMotionController.js.map