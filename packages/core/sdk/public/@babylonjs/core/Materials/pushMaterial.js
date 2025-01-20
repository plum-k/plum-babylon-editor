import { Matrix } from "../Maths/math.vector.js";
import { Material } from "../Materials/material.js";
/**
 * Base class of materials working in push mode in babylon JS
 * @internal
 */
export class PushMaterial extends Material {
    constructor(name, scene, storeEffectOnSubMeshes = true, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL);
        this._normalMatrix = new Matrix();
        this._storeEffectOnSubMeshes = storeEffectOnSubMeshes;
    }
    getEffect() {
        return this._storeEffectOnSubMeshes ? this._activeEffect : super.getEffect();
    }
    isReady(mesh, useInstances) {
        if (!mesh) {
            return false;
        }
        if (!this._storeEffectOnSubMeshes) {
            return true;
        }
        if (!mesh.subMeshes || mesh.subMeshes.length === 0) {
            return true;
        }
        return this.isReadyForSubMesh(mesh, mesh.subMeshes[0], useInstances);
    }
    _isReadyForSubMesh(subMesh) {
        const defines = subMesh.materialDefines;
        if (!this.checkReadyOnEveryCall && subMesh.effect && defines) {
            if (defines._renderId === this.getScene().getRenderId()) {
                return true;
            }
        }
        return false;
    }
    /**
     * Binds the given world matrix to the active effect
     *
     * @param world the matrix to bind
     */
    bindOnlyWorldMatrix(world) {
        this._activeEffect.setMatrix("world", world);
    }
    /**
     * Binds the given normal matrix to the active effect
     *
     * @param normalMatrix the matrix to bind
     */
    bindOnlyNormalMatrix(normalMatrix) {
        this._activeEffect.setMatrix("normalMatrix", normalMatrix);
    }
    bind(world, mesh) {
        if (!mesh) {
            return;
        }
        this.bindForSubMesh(world, mesh, mesh.subMeshes[0]);
    }
    _afterBind(mesh, effect = null, subMesh) {
        super._afterBind(mesh, effect, subMesh);
        this.getScene()._cachedEffect = effect;
        if (subMesh) {
            subMesh._drawWrapper._forceRebindOnNextCall = false;
        }
        else {
            this._drawWrapper._forceRebindOnNextCall = false;
        }
    }
    _mustRebind(scene, effect, subMesh, visibility = 1) {
        return subMesh._drawWrapper._forceRebindOnNextCall || scene.isCachedMaterialInvalid(this, effect, visibility);
    }
    dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh) {
        this._activeEffect = undefined;
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
    }
}
//# sourceMappingURL=pushMaterial.js.map