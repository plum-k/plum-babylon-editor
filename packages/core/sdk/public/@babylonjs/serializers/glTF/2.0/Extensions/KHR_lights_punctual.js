import { Vector3, Quaternion, TmpVectors } from "@babylonjs/core/Maths/math.vector.js";
import { Light } from "@babylonjs/core/Lights/light.js";
import { ShadowLight } from "@babylonjs/core/Lights/shadowLight.js";
import { GLTFExporter } from "../glTFExporter.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import { ConvertToRightHandedPosition, OmitDefaultValues, CollapseParentNode, IsParentAddedByImporter } from "../glTFUtilities.js";
const NAME = "KHR_lights_punctual";
const DEFAULTS = {
    name: "",
    color: [1, 1, 1],
    intensity: 1,
    range: Number.MAX_VALUE,
};
const SPOTDEFAULTS = {
    innerConeAngle: 0,
    outerConeAngle: Math.PI / 4.0,
};
const LIGHTDIRECTION = Vector3.Backward();
/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_lights_punctual {
    /**
     * @internal
     */
    constructor(exporter) {
        /** The name of this extension. */
        this.name = NAME;
        /** Defines whether this extension is enabled. */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        this._exporter = exporter;
    }
    /** @internal */
    dispose() {
        this._lights = null;
    }
    /** @internal */
    get wasUsed() {
        return !!this._lights;
    }
    /** @internal */
    onExporting() {
        this._exporter._glTF.extensions[NAME] = this._lights;
    }
    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     * @param nodeMap Node mapping of babylon node to glTF node index
     * @param convertToRightHanded Flag to convert the values to right-handed
     * @returns nullable INode promise
     */
    postExportNodeAsync(context, node, babylonNode, nodeMap, convertToRightHanded) {
        return new Promise((resolve) => {
            if (!(babylonNode instanceof ShadowLight)) {
                resolve(node);
                return;
            }
            const lightType = babylonNode.getTypeID() == Light.LIGHTTYPEID_POINTLIGHT
                ? "point" /* KHRLightsPunctual_LightType.POINT */
                : babylonNode.getTypeID() == Light.LIGHTTYPEID_DIRECTIONALLIGHT
                    ? "directional" /* KHRLightsPunctual_LightType.DIRECTIONAL */
                    : babylonNode.getTypeID() == Light.LIGHTTYPEID_SPOTLIGHT
                        ? "spot" /* KHRLightsPunctual_LightType.SPOT */
                        : null;
            if (!lightType) {
                Logger.Warn(`${context}: Light ${babylonNode.name} is not supported in ${NAME}`);
                resolve(node);
                return;
            }
            if (babylonNode.falloffType !== Light.FALLOFF_GLTF) {
                Logger.Warn(`${context}: Light falloff for ${babylonNode.name} does not match the ${NAME} specification!`);
            }
            // Set the node's translation and rotation here, since lights are not handled in exportNodeAsync
            if (!babylonNode.position.equalsToFloats(0, 0, 0)) {
                const translation = TmpVectors.Vector3[0].copyFrom(babylonNode.position);
                if (convertToRightHanded) {
                    ConvertToRightHandedPosition(translation);
                }
                node.translation = translation.asArray();
            }
            // Babylon lights have "constant" rotation and variable direction, while
            // glTF lights have variable rotation and constant direction. Therefore,
            // compute a quaternion that aligns the Babylon light's direction with glTF's constant one.
            if (lightType !== "point" /* KHRLightsPunctual_LightType.POINT */) {
                const direction = babylonNode.direction.normalizeToRef(TmpVectors.Vector3[0]);
                if (convertToRightHanded) {
                    ConvertToRightHandedPosition(direction);
                }
                const angle = Math.acos(Vector3.Dot(LIGHTDIRECTION, direction));
                const axis = Vector3.Cross(LIGHTDIRECTION, direction);
                const lightRotationQuaternion = Quaternion.RotationAxisToRef(axis, angle, TmpVectors.Quaternion[0]);
                if (!Quaternion.IsIdentity(lightRotationQuaternion)) {
                    node.rotation = lightRotationQuaternion.asArray();
                }
            }
            const light = {
                type: lightType,
                name: babylonNode.name,
                color: babylonNode.diffuse.asArray(),
                intensity: babylonNode.intensity,
                range: babylonNode.range,
            };
            OmitDefaultValues(light, DEFAULTS);
            // Separately handle the required 'spot' field for spot lights
            if (lightType === "spot" /* KHRLightsPunctual_LightType.SPOT */) {
                const babylonSpotLight = babylonNode;
                light.spot = {
                    innerConeAngle: babylonSpotLight.innerAngle / 2.0,
                    outerConeAngle: babylonSpotLight.angle / 2.0,
                };
                OmitDefaultValues(light.spot, SPOTDEFAULTS);
            }
            this._lights || (this._lights = {
                lights: [],
            });
            this._lights.lights.push(light);
            const lightReference = {
                light: this._lights.lights.length - 1,
            };
            // Assign the light to its parent node, if possible, to condense the glTF
            // Why and when: the glTF loader generates a new parent TransformNode for each light node, which we should undo on export
            const parentBabylonNode = babylonNode.parent;
            if (parentBabylonNode && IsParentAddedByImporter(babylonNode, parentBabylonNode)) {
                const parentNodeIndex = nodeMap.get(parentBabylonNode);
                if (parentNodeIndex) {
                    // Combine the light's transformation with the parent's
                    const parentNode = this._exporter._nodes[parentNodeIndex];
                    CollapseParentNode(node, parentNode);
                    parentNode.extensions || (parentNode.extensions = {});
                    parentNode.extensions[NAME] = lightReference;
                    // Do not export the original node
                    resolve(null);
                    return;
                }
            }
            node.extensions || (node.extensions = {});
            node.extensions[NAME] = lightReference;
            resolve(node);
        });
    }
}
GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_lights_punctual(exporter));
//# sourceMappingURL=KHR_lights_punctual.js.map