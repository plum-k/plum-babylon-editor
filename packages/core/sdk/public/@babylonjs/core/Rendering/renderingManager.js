import { RenderingGroup } from "./renderingGroup.js";
/**
 * This class is used by the onRenderingGroupObservable
 */
export class RenderingGroupInfo {
}
/**
 * This is the manager responsible of all the rendering for meshes sprites and particles.
 * It is enable to manage the different groups as well as the different necessary sort functions.
 * This should not be used directly aside of the few static configurations
 */
export class RenderingManager {
    /**
     * Gets or sets a boolean indicating that the manager will not reset between frames.
     * This means that if a mesh becomes invisible or transparent it will not be visible until this boolean is set to false again.
     * By default, the rendering manager will dispatch all active meshes per frame (moving them to the transparent, opaque or alpha testing lists).
     * By turning this property on, you will accelerate the rendering by keeping all these lists unchanged between frames.
     */
    get maintainStateBetweenFrames() {
        return this._maintainStateBetweenFrames;
    }
    set maintainStateBetweenFrames(value) {
        if (value === this._maintainStateBetweenFrames) {
            return;
        }
        this._maintainStateBetweenFrames = value;
        if (!this._maintainStateBetweenFrames) {
            this.restoreDispachedFlags();
        }
    }
    /**
     * Restore wasDispatched flags on the lists of elements to render.
     */
    restoreDispachedFlags() {
        for (const mesh of this._scene.meshes) {
            if (mesh.subMeshes) {
                for (const subMesh of mesh.subMeshes) {
                    subMesh._wasDispatched = false;
                }
            }
        }
        if (this._scene.spriteManagers) {
            for (const spriteManager of this._scene.spriteManagers) {
                spriteManager._wasDispatched = false;
            }
        }
        for (const particleSystem of this._scene.particleSystems) {
            particleSystem._wasDispatched = false;
        }
    }
    /**
     * Instantiates a new rendering group for a particular scene
     * @param scene Defines the scene the groups belongs to
     */
    constructor(scene) {
        /**
         * @internal
         */
        this._useSceneAutoClearSetup = false;
        this._renderingGroups = new Array();
        this._autoClearDepthStencil = {};
        this._customOpaqueSortCompareFn = {};
        this._customAlphaTestSortCompareFn = {};
        this._customTransparentSortCompareFn = {};
        this._renderingGroupInfo = new RenderingGroupInfo();
        this._maintainStateBetweenFrames = false;
        this._scene = scene;
        for (let i = RenderingManager.MIN_RENDERINGGROUPS; i < RenderingManager.MAX_RENDERINGGROUPS; i++) {
            this._autoClearDepthStencil[i] = { autoClear: true, depth: true, stencil: true };
        }
    }
    /**
     * @returns the rendering group with the specified id.
     * @param id the id of the rendering group (0 by default)
     */
    getRenderingGroup(id) {
        const renderingGroupId = id || 0;
        this._prepareRenderingGroup(renderingGroupId);
        return this._renderingGroups[renderingGroupId];
    }
    _clearDepthStencilBuffer(depth = true, stencil = true) {
        if (this._depthStencilBufferAlreadyCleaned) {
            return;
        }
        this._scene.getEngine().clear(null, false, depth, stencil);
        this._depthStencilBufferAlreadyCleaned = true;
    }
    /**
     * Renders the entire managed groups. This is used by the scene or the different render targets.
     * @internal
     */
    render(customRenderFunction, activeMeshes, renderParticles, renderSprites) {
        // Update the observable context (not null as it only goes away on dispose)
        const info = this._renderingGroupInfo;
        info.scene = this._scene;
        info.camera = this._scene.activeCamera;
        info.renderingManager = this;
        // Dispatch sprites
        if (this._scene.spriteManagers && renderSprites) {
            for (let index = 0; index < this._scene.spriteManagers.length; index++) {
                const manager = this._scene.spriteManagers[index];
                this.dispatchSprites(manager);
            }
        }
        // Render
        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            this._depthStencilBufferAlreadyCleaned = index === RenderingManager.MIN_RENDERINGGROUPS;
            const renderingGroup = this._renderingGroups[index];
            if (!renderingGroup || renderingGroup._empty) {
                continue;
            }
            const renderingGroupMask = 1 << index;
            info.renderingGroupId = index;
            // Before Observable
            this._scene.onBeforeRenderingGroupObservable.notifyObservers(info, renderingGroupMask);
            // Clear depth/stencil if needed
            if (RenderingManager.AUTOCLEAR) {
                const autoClear = this._useSceneAutoClearSetup ? this._scene.getAutoClearDepthStencilSetup(index) : this._autoClearDepthStencil[index];
                if (autoClear && autoClear.autoClear) {
                    this._clearDepthStencilBuffer(autoClear.depth, autoClear.stencil);
                }
            }
            // Render
            for (const step of this._scene._beforeRenderingGroupDrawStage) {
                step.action(index);
            }
            renderingGroup.render(customRenderFunction, renderSprites, renderParticles, activeMeshes);
            for (const step of this._scene._afterRenderingGroupDrawStage) {
                step.action(index);
            }
            // After Observable
            this._scene.onAfterRenderingGroupObservable.notifyObservers(info, renderingGroupMask);
        }
    }
    /**
     * Resets the different information of the group to prepare a new frame
     * @internal
     */
    reset() {
        if (this.maintainStateBetweenFrames) {
            return;
        }
        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            const renderingGroup = this._renderingGroups[index];
            if (renderingGroup) {
                renderingGroup.prepare();
            }
        }
    }
    /**
     * Resets the sprites information of the group to prepare a new frame
     * @internal
     */
    resetSprites() {
        if (this.maintainStateBetweenFrames) {
            return;
        }
        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            const renderingGroup = this._renderingGroups[index];
            if (renderingGroup) {
                renderingGroup.prepareSprites();
            }
        }
    }
    /**
     * Dispose and release the group and its associated resources.
     * @internal
     */
    dispose() {
        this.freeRenderingGroups();
        this._renderingGroups.length = 0;
        this._renderingGroupInfo = null;
    }
    /**
     * Clear the info related to rendering groups preventing retention points during dispose.
     */
    freeRenderingGroups() {
        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            const renderingGroup = this._renderingGroups[index];
            if (renderingGroup) {
                renderingGroup.dispose();
            }
        }
    }
    _prepareRenderingGroup(renderingGroupId) {
        if (this._renderingGroups[renderingGroupId] === undefined) {
            this._renderingGroups[renderingGroupId] = new RenderingGroup(renderingGroupId, this._scene, this._customOpaqueSortCompareFn[renderingGroupId], this._customAlphaTestSortCompareFn[renderingGroupId], this._customTransparentSortCompareFn[renderingGroupId]);
        }
    }
    /**
     * Add a sprite manager to the rendering manager in order to render it this frame.
     * @param spriteManager Define the sprite manager to render
     */
    dispatchSprites(spriteManager) {
        if (this.maintainStateBetweenFrames && spriteManager._wasDispatched) {
            return;
        }
        spriteManager._wasDispatched = true;
        this.getRenderingGroup(spriteManager.renderingGroupId).dispatchSprites(spriteManager);
    }
    /**
     * Add a particle system to the rendering manager in order to render it this frame.
     * @param particleSystem Define the particle system to render
     */
    dispatchParticles(particleSystem) {
        if (this.maintainStateBetweenFrames && particleSystem._wasDispatched) {
            return;
        }
        particleSystem._wasDispatched = true;
        this.getRenderingGroup(particleSystem.renderingGroupId).dispatchParticles(particleSystem);
    }
    /**
     * Add a submesh to the manager in order to render it this frame
     * @param subMesh The submesh to dispatch
     * @param mesh Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
     * @param material Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
     */
    dispatch(subMesh, mesh, material) {
        if (mesh === undefined) {
            mesh = subMesh.getMesh();
        }
        if (this.maintainStateBetweenFrames && subMesh._wasDispatched) {
            return;
        }
        subMesh._wasDispatched = true;
        this.getRenderingGroup(mesh.renderingGroupId).dispatch(subMesh, mesh, material);
    }
    /**
     * Overrides the default sort function applied in the rendering group to prepare the meshes.
     * This allowed control for front to back rendering or reversely depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    setRenderingOrder(renderingGroupId, opaqueSortCompareFn = null, alphaTestSortCompareFn = null, transparentSortCompareFn = null) {
        this._customOpaqueSortCompareFn[renderingGroupId] = opaqueSortCompareFn;
        this._customAlphaTestSortCompareFn[renderingGroupId] = alphaTestSortCompareFn;
        this._customTransparentSortCompareFn[renderingGroupId] = transparentSortCompareFn;
        if (this._renderingGroups[renderingGroupId]) {
            const group = this._renderingGroups[renderingGroupId];
            group.opaqueSortCompareFn = this._customOpaqueSortCompareFn[renderingGroupId];
            group.alphaTestSortCompareFn = this._customAlphaTestSortCompareFn[renderingGroupId];
            group.transparentSortCompareFn = this._customTransparentSortCompareFn[renderingGroupId];
        }
    }
    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     * @param depth Automatically clears depth between groups if true and autoClear is true.
     * @param stencil Automatically clears stencil between groups if true and autoClear is true.
     */
    setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil, depth = true, stencil = true) {
        this._autoClearDepthStencil[renderingGroupId] = {
            autoClear: autoClearDepthStencil,
            depth: depth,
            stencil: stencil,
        };
    }
    /**
     * Gets the current auto clear configuration for one rendering group of the rendering
     * manager.
     * @param index the rendering group index to get the information for
     * @returns The auto clear setup for the requested rendering group
     */
    getAutoClearDepthStencilSetup(index) {
        return this._autoClearDepthStencil[index];
    }
}
/**
 * The max id used for rendering groups (not included)
 */
RenderingManager.MAX_RENDERINGGROUPS = 4;
/**
 * The min id used for rendering groups (included)
 */
RenderingManager.MIN_RENDERINGGROUPS = 0;
/**
 * Used to globally prevent autoclearing scenes.
 */
RenderingManager.AUTOCLEAR = true;
//# sourceMappingURL=renderingManager.js.map