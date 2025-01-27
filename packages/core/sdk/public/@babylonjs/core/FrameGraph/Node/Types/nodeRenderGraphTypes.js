/**
 * Defines the kind of connection point for node render graph nodes
 */
export var NodeRenderGraphBlockConnectionPointTypes;
(function (NodeRenderGraphBlockConnectionPointTypes) {
    /** General purpose texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["Texture"] = 1] = "Texture";
    /** Back buffer color texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureBackBuffer"] = 2] = "TextureBackBuffer";
    /** Back buffer depth/stencil attachment */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureBackBufferDepthStencilAttachment"] = 4] = "TextureBackBufferDepthStencilAttachment";
    /** Depth/stencil attachment */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureDepthStencilAttachment"] = 8] = "TextureDepthStencilAttachment";
    /** Depth (in view space) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureViewDepth"] = 16] = "TextureViewDepth";
    /** Normal (in view space) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureViewNormal"] = 32] = "TextureViewNormal";
    /** Albedo geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureAlbedo"] = 64] = "TextureAlbedo";
    /** Reflectivity geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureReflectivity"] = 128] = "TextureReflectivity";
    /** Position (in world space) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureWorldPosition"] = 256] = "TextureWorldPosition";
    /** Velocity geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureVelocity"] = 512] = "TextureVelocity";
    /** Irradiance geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureIrradiance"] = 1024] = "TextureIrradiance";
    /** Albedo (sqrt) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureAlbedoSqrt"] = 2048] = "TextureAlbedoSqrt";
    /** Depth (in screen space) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureScreenDepth"] = 4096] = "TextureScreenDepth";
    /** Normal (in world space) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureWorldNormal"] = 8192] = "TextureWorldNormal";
    /** Position (in local space) geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureLocalPosition"] = 16384] = "TextureLocalPosition";
    /** Linear velocity geometry texture */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureLinearVelocity"] = 32768] = "TextureLinearVelocity";
    /** Bit field for all textures but back buffer depth/stencil */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureAllButBackBufferDepthStencil"] = 1048571] = "TextureAllButBackBufferDepthStencil";
    /** Bit field for all textures but back buffer color and depth/stencil */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureAllButBackBuffer"] = 1048569] = "TextureAllButBackBuffer";
    /** Bit field for all textures */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["TextureAll"] = 1048575] = "TextureAll";
    /** Resource container */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["ResourceContainer"] = 1048576] = "ResourceContainer";
    /** Shadow generator */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["ShadowGenerator"] = 2097152] = "ShadowGenerator";
    /** Light */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["ShadowLight"] = 4194304] = "ShadowLight";
    /** Camera */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["Camera"] = 16777216] = "Camera";
    /** List of objects (meshes, particle systems, sprites) */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["ObjectList"] = 33554432] = "ObjectList";
    /** Detect type based on connection */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["AutoDetect"] = 268435456] = "AutoDetect";
    /** Output type that will be defined by input type */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["BasedOnInput"] = 536870912] = "BasedOnInput";
    /** Undefined */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["Undefined"] = 1073741824] = "Undefined";
    /** Custom object */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["Object"] = 2147483648] = "Object";
    /** Bitmask of all types */
    NodeRenderGraphBlockConnectionPointTypes[NodeRenderGraphBlockConnectionPointTypes["All"] = 4294967295] = "All";
})(NodeRenderGraphBlockConnectionPointTypes || (NodeRenderGraphBlockConnectionPointTypes = {}));
/**
 * Enum used to define the compatibility state between two connection points
 */
export var NodeRenderGraphConnectionPointCompatibilityStates;
(function (NodeRenderGraphConnectionPointCompatibilityStates) {
    /** Points are compatibles */
    NodeRenderGraphConnectionPointCompatibilityStates[NodeRenderGraphConnectionPointCompatibilityStates["Compatible"] = 0] = "Compatible";
    /** Points are incompatible because of their types */
    NodeRenderGraphConnectionPointCompatibilityStates[NodeRenderGraphConnectionPointCompatibilityStates["TypeIncompatible"] = 1] = "TypeIncompatible";
    /** Points are incompatible because they are in the same hierarchy **/
    NodeRenderGraphConnectionPointCompatibilityStates[NodeRenderGraphConnectionPointCompatibilityStates["HierarchyIssue"] = 2] = "HierarchyIssue";
})(NodeRenderGraphConnectionPointCompatibilityStates || (NodeRenderGraphConnectionPointCompatibilityStates = {}));
/**
 * Defines the direction of a connection point
 */
export var NodeRenderGraphConnectionPointDirection;
(function (NodeRenderGraphConnectionPointDirection) {
    /** Input */
    NodeRenderGraphConnectionPointDirection[NodeRenderGraphConnectionPointDirection["Input"] = 0] = "Input";
    /** Output */
    NodeRenderGraphConnectionPointDirection[NodeRenderGraphConnectionPointDirection["Output"] = 1] = "Output";
})(NodeRenderGraphConnectionPointDirection || (NodeRenderGraphConnectionPointDirection = {}));
//# sourceMappingURL=nodeRenderGraphTypes.js.map