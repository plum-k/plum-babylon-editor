/**
 * Enum used to define the material modes
 */
export var NodeMaterialModes;
(function (NodeMaterialModes) {
    /** Regular material */
    NodeMaterialModes[NodeMaterialModes["Material"] = 0] = "Material";
    /** For post process */
    NodeMaterialModes[NodeMaterialModes["PostProcess"] = 1] = "PostProcess";
    /** For particle system */
    NodeMaterialModes[NodeMaterialModes["Particle"] = 2] = "Particle";
    /** For procedural texture */
    NodeMaterialModes[NodeMaterialModes["ProceduralTexture"] = 3] = "ProceduralTexture";
    /** For gaussian splatting */
    NodeMaterialModes[NodeMaterialModes["GaussianSplatting"] = 4] = "GaussianSplatting";
})(NodeMaterialModes || (NodeMaterialModes = {}));
//# sourceMappingURL=nodeMaterialModes.js.map