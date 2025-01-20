import { AbstractEngine } from "../abstractEngine.js";
AbstractEngine.prototype.getRenderPassNames = function () {
    return this._renderPassNames;
};
AbstractEngine.prototype.getCurrentRenderPassName = function () {
    return this._renderPassNames[this.currentRenderPassId];
};
AbstractEngine.prototype.createRenderPassId = function (name) {
    // Note: render pass id == 0 is always for the main render pass
    const id = ++AbstractEngine._RenderPassIdCounter;
    this._renderPassNames[id] = name ?? "NONAME";
    return id;
};
AbstractEngine.prototype.releaseRenderPassId = function (id) {
    this._renderPassNames[id] = undefined;
    for (let s = 0; s < this.scenes.length; ++s) {
        const scene = this.scenes[s];
        for (let m = 0; m < scene.meshes.length; ++m) {
            const mesh = scene.meshes[m];
            if (mesh.subMeshes) {
                for (let b = 0; b < mesh.subMeshes.length; ++b) {
                    const subMesh = mesh.subMeshes[b];
                    subMesh._removeDrawWrapper(id);
                }
            }
        }
    }
};
//# sourceMappingURL=abstractEngine.renderPass.js.map