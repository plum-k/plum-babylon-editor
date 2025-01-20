import { Tools } from "@babylonjs/core/Misc/tools.js";
import { GLTFExporter } from "../glTFExporter.js";
const NAME = "KHR_texture_transform";
/**
 * Computes the adjusted offset for a rotation centered about the origin.
 * This does not work when scaling is involved; investigation is needed.
 * @internal
 */
function AdjustOffsetForRotationCenter(babylonTexture) {
    const { uOffset, vOffset, uRotationCenter, vRotationCenter, wAng } = babylonTexture;
    const cosAngle = Math.cos(-wAng);
    const sinAngle = Math.sin(-wAng);
    const deltaU = uRotationCenter * (1 - cosAngle) - vRotationCenter * sinAngle;
    const deltaV = vRotationCenter * (1 - cosAngle) + uRotationCenter * sinAngle;
    return [uOffset + deltaU, vOffset + deltaV];
}
/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_texture_transform {
    constructor() {
        /** Name of this extension */
        this.name = NAME;
        /** Defines whether this extension is enabled */
        this.enabled = true;
        /** Defines whether this extension is required */
        this.required = false;
        /** Reference to the glTF exporter */
        this._wasUsed = false;
    }
    dispose() { }
    /** @internal */
    get wasUsed() {
        return this._wasUsed;
    }
    postExportTexture(context, textureInfo, babylonTexture) {
        const scene = babylonTexture.getScene();
        if (!scene) {
            Tools.Warn(`${context}: "scene" is not defined for Babylon texture ${babylonTexture.name}! Not exporting with ${NAME}.`);
            return;
        }
        /*
         * The KHR_texture_transform schema only supports w rotation around the origin.
         * See https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform#gltf-schema-updates.
         */
        if (babylonTexture.uAng !== 0 || babylonTexture.vAng !== 0) {
            Tools.Warn(`${context}: Texture ${babylonTexture.name} with rotation in the u or v axis is not supported in glTF.`);
            return;
        }
        const textureTransform = {};
        let transformIsRequired = false;
        if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
            textureTransform.offset = [babylonTexture.uOffset, babylonTexture.vOffset];
            transformIsRequired = true;
        }
        if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
            textureTransform.scale = [babylonTexture.uScale, babylonTexture.vScale];
            transformIsRequired = true;
        }
        if (babylonTexture.wAng !== 0) {
            if (babylonTexture.uRotationCenter !== 0 || babylonTexture.vRotationCenter !== 0) {
                if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
                    Tools.Warn(`${context}: Texture ${babylonTexture.name} with scaling and a rotation not centered at the origin cannot be exported with ${NAME}`);
                    return;
                }
                Tools.Warn(`${context}: Texture ${babylonTexture.name} with rotation not centered at the origin will be exported with an adjusted texture offset for ${NAME}.`);
                textureTransform.offset = AdjustOffsetForRotationCenter(babylonTexture);
            }
            textureTransform.rotation = -babylonTexture.wAng;
            transformIsRequired = true;
        }
        if (babylonTexture.coordinatesIndex !== 0) {
            textureTransform.texCoord = babylonTexture.coordinatesIndex;
            transformIsRequired = true;
        }
        if (!transformIsRequired) {
            return;
        }
        this._wasUsed = true;
        if (!textureInfo.extensions) {
            textureInfo.extensions = {};
        }
        textureInfo.extensions[NAME] = textureTransform;
    }
}
GLTFExporter.RegisterExtension(NAME, () => new KHR_texture_transform());
//# sourceMappingURL=KHR_texture_transform.js.map