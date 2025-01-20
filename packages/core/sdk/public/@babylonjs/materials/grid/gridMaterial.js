import { __decorate } from "@babylonjs/core/tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, serializeAsVector3 } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Vector4, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import "./grid.fragment.js";
import "./grid.vertex.js";
import { BindFogParameters, BindLogDepth, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForMisc, } from "@babylonjs/core/Materials/materialHelper.functions.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
class GridMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.OPACITY = false;
        this.ANTIALIAS = false;
        this.TRANSPARENT = false;
        this.FOG = false;
        this.PREMULTIPLYALPHA = false;
        this.MAX_LINE = false;
        this.UV1 = false;
        this.UV2 = false;
        this.INSTANCES = false;
        this.THIN_INSTANCES = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
/**
 * The grid materials allows you to wrap any shape with a grid.
 * Colors are customizable.
 */
export class GridMaterial extends PushMaterial {
    /**
     * constructor
     * @param name The name given to the material in order to identify it afterwards.
     * @param scene The scene the material is used in.
     */
    constructor(name, scene) {
        super(name, scene);
        /**
         * Main color of the grid (e.g. between lines)
         */
        this.mainColor = Color3.Black();
        /**
         * Color of the grid lines.
         */
        this.lineColor = Color3.Teal();
        /**
         * The scale of the grid compared to unit.
         */
        this.gridRatio = 1.0;
        /**
         * Allows setting an offset for the grid lines.
         */
        this.gridOffset = Vector3.Zero();
        /**
         * The frequency of thicker lines.
         */
        this.majorUnitFrequency = 10;
        /**
         * The visibility of minor units in the grid.
         */
        this.minorUnitVisibility = 0.33;
        /**
         * The grid opacity outside of the lines.
         */
        this.opacity = 1.0;
        /**
         * Whether to antialias the grid
         */
        this.antialias = true;
        /**
         * Determine RBG output is premultiplied by alpha value.
         */
        this.preMultiplyAlpha = false;
        /**
         * Determines if the max line value will be used instead of the sum wherever grid lines intersect.
         */
        this.useMaxLine = false;
        this._gridControl = new Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);
    }
    /**
     * @returns whether or not the grid requires alpha blending.
     */
    needAlphaBlending() {
        return this.opacity < 1.0 || (this._opacityTexture && this._opacityTexture.isReady());
    }
    needAlphaBlendingForMesh(mesh) {
        return mesh.visibility < 1.0 || this.needAlphaBlending();
    }
    isReadyForSubMesh(mesh, subMesh, useInstances) {
        const drawWrapper = subMesh._drawWrapper;
        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new GridMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        const scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        if (defines.TRANSPARENT !== this.opacity < 1.0) {
            defines.TRANSPARENT = !defines.TRANSPARENT;
            defines.markAsUnprocessed();
        }
        if (defines.PREMULTIPLYALPHA != this.preMultiplyAlpha) {
            defines.PREMULTIPLYALPHA = !defines.PREMULTIPLYALPHA;
            defines.markAsUnprocessed();
        }
        if (defines.MAX_LINE !== this.useMaxLine) {
            defines.MAX_LINE = !defines.MAX_LINE;
            defines.markAsUnprocessed();
        }
        if (defines.ANTIALIAS !== this.antialias) {
            defines.ANTIALIAS = !defines.ANTIALIAS;
            defines.markAsUnprocessed();
        }
        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    if (!this._opacityTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.OPACITY = true;
                    }
                }
            }
        }
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, false, this.fogEnabled, false, defines);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, scene.getEngine(), this, defines, !!useInstances);
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Attributes
            PrepareDefinesForAttributes(mesh, defines, false, false);
            const attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];
            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }
            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;
            PrepareAttributesForInstances(attribs, defines);
            const uniforms = [
                "projection",
                "mainColor",
                "lineColor",
                "gridControl",
                "gridOffset",
                "vFogInfos",
                "vFogColor",
                "world",
                "view",
                "opacityMatrix",
                "vOpacityInfos",
                "visibility",
                "logarithmicDepthConstant",
            ];
            // Defines
            const join = defines.toString();
            addClipPlaneUniforms(uniforms);
            subMesh.setEffect(scene.getEngine().createEffect("grid", attribs, uniforms, ["opacitySampler"], join, undefined, this.onCompiled, this.onError), defines, this._materialContext);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;
        return true;
    }
    bindForSubMesh(world, mesh, subMesh) {
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (!defines) {
            return;
        }
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;
        this._activeEffect.setFloat("visibility", mesh.visibility);
        // Matrices
        if (!defines.INSTANCES || defines.THIN_INSTANCE) {
            this.bindOnlyWorldMatrix(world);
        }
        this._activeEffect.setMatrix("view", scene.getViewMatrix());
        this._activeEffect.setMatrix("projection", scene.getProjectionMatrix());
        // Uniforms
        if (this._mustRebind(scene, effect, subMesh)) {
            this._activeEffect.setColor3("mainColor", this.mainColor);
            this._activeEffect.setColor3("lineColor", this.lineColor);
            this._activeEffect.setVector3("gridOffset", this.gridOffset);
            this._gridControl.x = this.gridRatio;
            this._gridControl.y = Math.round(this.majorUnitFrequency);
            this._gridControl.z = this.minorUnitVisibility;
            this._gridControl.w = this.opacity;
            this._activeEffect.setVector4("gridControl", this._gridControl);
            if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                this._activeEffect.setFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                this._activeEffect.setMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
            }
            // Clip plane
            bindClipPlane(effect, this, scene);
            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    /**
     * Dispose the material and its associated resources.
     * @param forceDisposeEffect will also dispose the used effect when true
     */
    dispose(forceDisposeEffect) {
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new GridMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GridMaterial";
        return serializationObject;
    }
    getClassName() {
        return "GridMaterial";
    }
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new GridMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serializeAsColor3()
], GridMaterial.prototype, "mainColor", void 0);
__decorate([
    serializeAsColor3()
], GridMaterial.prototype, "lineColor", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "gridRatio", void 0);
__decorate([
    serializeAsVector3()
], GridMaterial.prototype, "gridOffset", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "majorUnitFrequency", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "minorUnitVisibility", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "opacity", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "antialias", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "preMultiplyAlpha", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "useMaxLine", void 0);
__decorate([
    serializeAsTexture("opacityTexture")
], GridMaterial.prototype, "_opacityTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], GridMaterial.prototype, "opacityTexture", void 0);
RegisterClass("BABYLON.GridMaterial", GridMaterial);
//# sourceMappingURL=gridMaterial.js.map