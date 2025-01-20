/**
 * @internal
 */
export var MaterialPluginEvent;
(function (MaterialPluginEvent) {
    MaterialPluginEvent[MaterialPluginEvent["Created"] = 1] = "Created";
    MaterialPluginEvent[MaterialPluginEvent["Disposed"] = 2] = "Disposed";
    MaterialPluginEvent[MaterialPluginEvent["GetDefineNames"] = 4] = "GetDefineNames";
    MaterialPluginEvent[MaterialPluginEvent["PrepareUniformBuffer"] = 8] = "PrepareUniformBuffer";
    MaterialPluginEvent[MaterialPluginEvent["IsReadyForSubMesh"] = 16] = "IsReadyForSubMesh";
    MaterialPluginEvent[MaterialPluginEvent["PrepareDefines"] = 32] = "PrepareDefines";
    MaterialPluginEvent[MaterialPluginEvent["BindForSubMesh"] = 64] = "BindForSubMesh";
    MaterialPluginEvent[MaterialPluginEvent["PrepareEffect"] = 128] = "PrepareEffect";
    MaterialPluginEvent[MaterialPluginEvent["GetAnimatables"] = 256] = "GetAnimatables";
    MaterialPluginEvent[MaterialPluginEvent["GetActiveTextures"] = 512] = "GetActiveTextures";
    MaterialPluginEvent[MaterialPluginEvent["HasTexture"] = 1024] = "HasTexture";
    MaterialPluginEvent[MaterialPluginEvent["FillRenderTargetTextures"] = 2048] = "FillRenderTargetTextures";
    MaterialPluginEvent[MaterialPluginEvent["HasRenderTargetTextures"] = 4096] = "HasRenderTargetTextures";
    MaterialPluginEvent[MaterialPluginEvent["HardBindForSubMesh"] = 8192] = "HardBindForSubMesh";
})(MaterialPluginEvent || (MaterialPluginEvent = {}));
//# sourceMappingURL=materialPluginEvent.js.map