import { SmartArray, SmartArrayNoDuplicate } from "../Misc/smartArray.js";
import { Vector3 } from "../Maths/math.vector.js";

/**
 * This represents the object necessary to create a rendering group.
 * This is exclusively used and created by the rendering manager.
 * To modify the behavior, you use the available helpers in your scene or meshes.
 * @internal
 */
export class RenderingGroup {
    /**
     * Set the opaque sort comparison function.
     * If null the sub meshes will be render in the order they were created
     */
    set opaqueSortCompareFn(value) {
        if (value) {
            this._opaqueSortCompareFn = value;
        }
        else {
            this._opaqueSortCompareFn = RenderingGroup.PainterSortCompare;
        }
        this._renderOpaque = this._renderOpaqueSorted;
    }
    /**
     * Set the alpha test sort comparison function.
     * If null the sub meshes will be render in the order they were created
     */
    set alphaTestSortCompareFn(value) {
        if (value) {
            this._alphaTestSortCompareFn = value;
        }
        else {
            this._alphaTestSortCompareFn = RenderingGroup.PainterSortCompare;
        }
        this._renderAlphaTest = this._renderAlphaTestSorted;
    }
    /**
     * Set the transparent sort comparison function.
     * If null the sub meshes will be render in the order they were created
     */
    set transparentSortCompareFn(value) {
        if (value) {
            this._transparentSortCompareFn = value;
        }
        else {
            this._transparentSortCompareFn = RenderingGroup.defaultTransparentSortCompare;
        }
        this._renderTransparent = this._renderTransparentSorted;
    }
    /**
     * Creates a new rendering group.
     * @param index The rendering group index
     * @param scene
     * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
     * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
     * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
     */
    constructor(index, scene, opaqueSortCompareFn = null, alphaTestSortCompareFn = null, transparentSortCompareFn = null) {
        this.index = index;
        this._opaqueSubMeshes = new SmartArray(256);
        this._transparentSubMeshes = new SmartArray(256);
        this._alphaTestSubMeshes = new SmartArray(256);
        this._depthOnlySubMeshes = new SmartArray(256);
        this._particleSystems = new SmartArray(256);
        this._spriteManagers = new SmartArray(256);
        /** @internal */
        this._empty = true;
        /** @internal */
        this._edgesRenderers = new SmartArrayNoDuplicate(16);
        this._scene = scene;
        this.opaqueSortCompareFn = opaqueSortCompareFn;
        this.alphaTestSortCompareFn = alphaTestSortCompareFn;
        this.transparentSortCompareFn = transparentSortCompareFn;
    }
    /**
     * Render all the sub meshes contained in the group.
     * @param customRenderFunction Used to override the default render behaviour of the group.
     * @param renderSprites
     * @param renderParticles
     * @param activeMeshes
     */
    render(customRenderFunction, renderSprites, renderParticles, activeMeshes) {
        if (customRenderFunction) {
            customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, this._depthOnlySubMeshes);
            return;
        }
        const engine = this._scene.getEngine();
        // Depth only
        if (this._depthOnlySubMeshes.length !== 0) {
            engine.setColorWrite(false);
            this._renderAlphaTest(this._depthOnlySubMeshes);
            engine.setColorWrite(true);
        }
        // Opaque
        if (this._opaqueSubMeshes.length !== 0) {
            this._renderOpaque(this._opaqueSubMeshes);
        }
        // Alpha test
        if (this._alphaTestSubMeshes.length !== 0) {
            this._renderAlphaTest(this._alphaTestSubMeshes);
        }
        const stencilState = engine.getStencilBuffer();
        engine.setStencilBuffer(false);
        // Sprites
        if (renderSprites) {
            this._renderSprites();
        }
        // Particles
        if (renderParticles) {
            this._renderParticles(activeMeshes);
        }
        if (this.onBeforeTransparentRendering) {
            this.onBeforeTransparentRendering();
        }
        // Transparent
        if (this._transparentSubMeshes.length !== 0 || this._scene.useOrderIndependentTransparency) {
            engine.setStencilBuffer(stencilState);
            if (this._scene.useOrderIndependentTransparency) {
                const excludedMeshes = this._scene.depthPeelingRenderer.render(this._transparentSubMeshes);
                if (excludedMeshes.length) {
                    // Render leftover meshes that could not be processed by depth peeling
                    this._renderTransparent(excludedMeshes);
                }
            }
            else {
                this._renderTransparent(this._transparentSubMeshes);
            }
            engine.setAlphaMode(0);
        }
        // Set back stencil to false in case it changes before the edge renderer.
        engine.setStencilBuffer(false);
        // Edges
        if (this._edgesRenderers.length) {
            for (let edgesRendererIndex = 0; edgesRendererIndex < this._edgesRenderers.length; edgesRendererIndex++) {
                this._edgesRenderers.data[edgesRendererIndex].render();
            }
            engine.setAlphaMode(0);
        }
        // Restore Stencil state.
        engine.setStencilBuffer(stencilState);
    }
    /**
     * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
     * @param subMeshes The submeshes to render
     */
    _renderOpaqueSorted(subMeshes) {
        RenderingGroup._RenderSorted(subMeshes, this._opaqueSortCompareFn, this._scene.activeCamera, false);
    }
    /**
     * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
     * @param subMeshes The submeshes to render
     */
    _renderAlphaTestSorted(subMeshes) {
        RenderingGroup._RenderSorted(subMeshes, this._alphaTestSortCompareFn, this._scene.activeCamera, false);
    }
    /**
     * Renders the opaque submeshes in the order from the transparentSortCompareFn.
     * @param subMeshes The submeshes to render
     */
    _renderTransparentSorted(subMeshes) {
        RenderingGroup._RenderSorted(subMeshes, this._transparentSortCompareFn, this._scene.activeCamera, true);
    }
    /**
     * Renders the submeshes in a specified order.
     * @param subMeshes The submeshes to sort before render
     * @param sortCompareFn The comparison function use to sort
     * @param camera The camera position use to preprocess the submeshes to help sorting
     * @param transparent Specifies to activate blending if true
     */
    static _RenderSorted(subMeshes, sortCompareFn, camera, transparent) {
        let subIndex = 0;
        let subMesh;
        const cameraPosition = camera ? camera.globalPosition : RenderingGroup._ZeroVector;
        if (transparent) {
            for (; subIndex < subMeshes.length; subIndex++) {
                subMesh = subMeshes.data[subIndex];
                subMesh._alphaIndex = subMesh.getMesh().alphaIndex;
                subMesh._distanceToCamera = Vector3.Distance(subMesh.getBoundingInfo().boundingSphere.centerWorld, cameraPosition);
            }
        }
        const sortedArray = subMeshes.length === subMeshes.data.length ? subMeshes.data : subMeshes.data.slice(0, subMeshes.length);
        if (sortCompareFn) {
            sortedArray.sort(sortCompareFn);
        }
        const scene = sortedArray[0].getMesh().getScene();
        for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
            subMesh = sortedArray[subIndex];
            if (scene._activeMeshesFrozenButKeepClipping && !subMesh.isInFrustum(scene._frustumPlanes)) {
                continue;
            }
            if (transparent) {
                const material = subMesh.getMaterial();
                if (material && material.needDepthPrePass) {
                    const engine = material.getScene().getEngine();
                    engine.setColorWrite(false);
                    engine.setAlphaMode(0);
                    subMesh.render(false);
                    engine.setColorWrite(true);
                }
            }
            subMesh.render(transparent);
        }
    }
    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are rendered back to front if in the same alpha index.
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static defaultTransparentSortCompare(a, b) {
        // Alpha index first
        if (a._alphaIndex > b._alphaIndex) {
            return 1;
        }
        if (a._alphaIndex < b._alphaIndex) {
            return -1;
        }
        // Then distance to camera
        return RenderingGroup.backToFrontSortCompare(a, b);
    }
    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are rendered back to front.
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static backToFrontSortCompare(a, b) {
        // Then distance to camera
        if (a._distanceToCamera < b._distanceToCamera) {
            return 1;
        }
        if (a._distanceToCamera > b._distanceToCamera) {
            return -1;
        }
        return 0;
    }
    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are rendered front to back (prevent overdraw).
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static frontToBackSortCompare(a, b) {
        // Then distance to camera
        if (a._distanceToCamera < b._distanceToCamera) {
            return -1;
        }
        if (a._distanceToCamera > b._distanceToCamera) {
            return 1;
        }
        return 0;
    }
    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are grouped by material then geometry.
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    static PainterSortCompare(a, b) {
        const meshA = a.getMesh();
        const meshB = b.getMesh();
        if (meshA.material && meshB.material) {
            return meshA.material.uniqueId - meshB.material.uniqueId;
        }
        return meshA.uniqueId - meshB.uniqueId;
    }
    /**
     * Resets the different lists of submeshes to prepare a new frame.
     */
    prepare() {
        this._opaqueSubMeshes.reset();
        this._transparentSubMeshes.reset();
        this._alphaTestSubMeshes.reset();
        this._depthOnlySubMeshes.reset();
        this._particleSystems.reset();
        this.prepareSprites();
        this._edgesRenderers.reset();
        this._empty = true;
    }
    /**
     * Resets the different lists of sprites to prepare a new frame.
     */
    prepareSprites() {
        this._spriteManagers.reset();
    }
    dispose() {
        this._opaqueSubMeshes.dispose();
        this._transparentSubMeshes.dispose();
        this._alphaTestSubMeshes.dispose();
        this._depthOnlySubMeshes.dispose();
        this._particleSystems.dispose();
        this._spriteManagers.dispose();
        this._edgesRenderers.dispose();
    }
    /**
     * Inserts the submesh in its correct queue depending on its material.
     * @param subMesh The submesh to dispatch
     * @param [mesh] Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
     * @param [material] Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
     */
    dispatch(subMesh, mesh, material) {
        // Get mesh and materials if not provided
        if (mesh === undefined) {
            mesh = subMesh.getMesh();
        }
        if (material === undefined) {
            material = subMesh.getMaterial();
        }
        if (material === null || material === undefined) {
            return;
        }
        if (material.needAlphaBlendingForMesh(mesh)) {
            // Transparent
            this._transparentSubMeshes.push(subMesh);
        }
        else if (material.needAlphaTesting()) {
            // Alpha test
            if (material.needDepthPrePass) {
                this._depthOnlySubMeshes.push(subMesh);
            }
            this._alphaTestSubMeshes.push(subMesh);
        }
        else {
            if (material.needDepthPrePass) {
                this._depthOnlySubMeshes.push(subMesh);
            }
            this._opaqueSubMeshes.push(subMesh); // Opaque
        }
        mesh._renderingGroup = this;
        if (mesh._edgesRenderer && mesh.isEnabled() && mesh.isVisible && mesh._edgesRenderer.isEnabled) {
            this._edgesRenderers.pushNoDuplicate(mesh._edgesRenderer);
        }
        this._empty = false;
    }
    dispatchSprites(spriteManager) {
        this._spriteManagers.push(spriteManager);
        this._empty = false;
    }
    dispatchParticles(particleSystem) {
        this._particleSystems.push(particleSystem);
        this._empty = false;
    }
    _renderParticles(activeMeshes) {
        if (this._particleSystems.length === 0) {
            return;
        }
        // Particles
        const activeCamera = this._scene.activeCamera;
        this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
        for (let particleIndex = 0; particleIndex < this._particleSystems.length; particleIndex++) {
            const particleSystem = this._particleSystems.data[particleIndex];
            if ((activeCamera && activeCamera.layerMask & particleSystem.layerMask) === 0) {
                continue;
            }
            const emitter = particleSystem.emitter;
            if (!emitter.position || !activeMeshes || activeMeshes.indexOf(emitter) !== -1) {
                this._scene._activeParticles.addCount(particleSystem.render(), false);
            }
        }
        this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
    }
    _renderSprites() {
        if (!this._scene.spritesEnabled || this._spriteManagers.length === 0) {
            return;
        }
        // Sprites
        const activeCamera = this._scene.activeCamera;
        this._scene.onBeforeSpritesRenderingObservable.notifyObservers(this._scene);
        for (let id = 0; id < this._spriteManagers.length; id++) {
            const spriteManager = this._spriteManagers.data[id];
            if ((activeCamera && activeCamera.layerMask & spriteManager.layerMask) !== 0) {
                spriteManager.render();
            }
        }
        this._scene.onAfterSpritesRenderingObservable.notifyObservers(this._scene);
    }
}
RenderingGroup._ZeroVector = Vector3.Zero();
//# sourceMappingURL=renderingGroup.js.map