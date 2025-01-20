import { __decorate } from "../tslib.es6.js";
import { serialize, expandToProperty } from "../Misc/decorators.js";
import { MaterialDefines } from "./materialDefines.js";
import { MaterialPluginBase } from "./materialPluginBase.js";

import { MaterialFlags } from "./materialFlags.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { BindTextureMatrix, PrepareDefinesForMergedUV } from "./materialHelper.functions.js";
/**
 * @internal
 */
export class DecalMapDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.DECAL = false;
        this.DECALDIRECTUV = 0;
        this.DECAL_SMOOTHALPHA = false;
        this.GAMMADECAL = false;
    }
}
/**
 * Plugin that implements the decal map component of a material
 * @since 5.49.1
 */
export class DecalMapConfiguration extends MaterialPluginBase {
    /** @internal */
    _markAllSubMeshesAsTexturesDirty() {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible() {
        return true;
    }
    /**
     * Creates a new DecalMapConfiguration
     * @param material The material to attach the decal map plugin to
     * @param addToPluginList If the plugin should be added to the material plugin list
     */
    constructor(material, addToPluginList = true) {
        super(material, "DecalMap", 150, new DecalMapDefines(), addToPluginList);
        this._isEnabled = false;
        /**
         * Enables or disables the decal map on this material
         */
        this.isEnabled = false;
        this._smoothAlpha = false;
        /**
         * Enables or disables the smooth alpha mode on this material. Default: false.
         * When enabled, the alpha value used to blend the decal map will be the squared value and will produce a smoother result.
         */
        this.smoothAlpha = false;
        this.registerForExtraEvents = true; // because we override the hardBindForSubMesh method
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
    }
    isReadyForSubMesh(defines, scene, engine, subMesh) {
        const decalMap = subMesh.getMesh().decalMap;
        if (!this._isEnabled || !decalMap?.texture || !MaterialFlags.DecalMapEnabled || !scene.texturesEnabled) {
            return true;
        }
        return decalMap.isReady();
    }
    prepareDefinesBeforeAttributes(defines, scene, mesh) {
        const decalMap = mesh.decalMap;
        if (!this._isEnabled || !decalMap?.texture || !MaterialFlags.DecalMapEnabled || !scene.texturesEnabled) {
            const isDirty = defines.DECAL;
            if (isDirty) {
                defines.markAsTexturesDirty();
            }
            defines.DECAL = false;
        }
        else {
            const isDirty = !defines.DECAL || defines.GAMMADECAL !== decalMap.texture.gammaSpace;
            if (isDirty) {
                defines.markAsTexturesDirty();
            }
            defines.DECAL = true;
            defines.GAMMADECAL = decalMap.texture.gammaSpace;
            defines.DECAL_SMOOTHALPHA = this._smoothAlpha;
            PrepareDefinesForMergedUV(decalMap.texture, defines, "DECAL");
        }
    }
    hardBindForSubMesh(uniformBuffer, scene, _engine, subMesh) {
        /**
         * Note that we override hardBindForSubMesh and not bindForSubMesh because the material can be shared by multiple meshes,
         * in which case mustRebind could return false even though the decal map is different for each mesh: that's because the decal map
         * is not part of the material but hosted by the decalMap of the mesh instead.
         */
        const decalMap = subMesh.getMesh().decalMap;
        if (!this._isEnabled || !decalMap?.texture || !MaterialFlags.DecalMapEnabled || !scene.texturesEnabled) {
            return;
        }
        const isFrozen = this._material.isFrozen;
        const texture = decalMap.texture;
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            uniformBuffer.updateFloat4("vDecalInfos", texture.coordinatesIndex, 0, 0, 0);
            BindTextureMatrix(texture, uniformBuffer, "decal");
        }
        uniformBuffer.setTexture("decalSampler", texture);
    }
    getClassName() {
        return "DecalMapConfiguration";
    }
    getSamplers(samplers) {
        samplers.push("decalSampler");
    }
    getUniforms() {
        return {
            ubo: [
                { name: "vDecalInfos", size: 4, type: "vec4" },
                { name: "decalMatrix", size: 16, type: "mat4" },
            ],
        };
    }
}
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], DecalMapConfiguration.prototype, "isEnabled", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], DecalMapConfiguration.prototype, "smoothAlpha", void 0);
RegisterClass("BABYLON.DecalMapConfiguration", DecalMapConfiguration);
//# sourceMappingURL=material.decalMapConfiguration.js.map