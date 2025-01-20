/**
 * Material types for GreasedLine
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#materialtype}
 */
export var GreasedLineMeshMaterialType;
(function (GreasedLineMeshMaterialType) {
    /**
     * StandardMaterial
     */
    GreasedLineMeshMaterialType[GreasedLineMeshMaterialType["MATERIAL_TYPE_STANDARD"] = 0] = "MATERIAL_TYPE_STANDARD";
    /**
     * PBR Material
     */
    GreasedLineMeshMaterialType[GreasedLineMeshMaterialType["MATERIAL_TYPE_PBR"] = 1] = "MATERIAL_TYPE_PBR";
    /**
     * Simple and fast shader material without texture, light, fog, instances, ... support.
     * Just raw colored lines.
     * Dashing and visibility is supported.
     */
    GreasedLineMeshMaterialType[GreasedLineMeshMaterialType["MATERIAL_TYPE_SIMPLE"] = 2] = "MATERIAL_TYPE_SIMPLE";
})(GreasedLineMeshMaterialType || (GreasedLineMeshMaterialType = {}));
/**
 * Color blending mode of the @see GreasedLineMaterial and the base material
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#colormode}
 */
export var GreasedLineMeshColorMode;
(function (GreasedLineMeshColorMode) {
    /**
     * Color blending mode SET
     */
    GreasedLineMeshColorMode[GreasedLineMeshColorMode["COLOR_MODE_SET"] = 0] = "COLOR_MODE_SET";
    /**
     * Color blending mode ADD
     */
    GreasedLineMeshColorMode[GreasedLineMeshColorMode["COLOR_MODE_ADD"] = 1] = "COLOR_MODE_ADD";
    /**
     * Color blending mode ADD
     */
    GreasedLineMeshColorMode[GreasedLineMeshColorMode["COLOR_MODE_MULTIPLY"] = 2] = "COLOR_MODE_MULTIPLY";
})(GreasedLineMeshColorMode || (GreasedLineMeshColorMode = {}));
/**
 * Color distribution type of the @see colors.
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#colordistributiontype}
 *
 */
export var GreasedLineMeshColorDistributionType;
(function (GreasedLineMeshColorDistributionType) {
    /**
     * Colors distributed between segments of the line
     */
    GreasedLineMeshColorDistributionType[GreasedLineMeshColorDistributionType["COLOR_DISTRIBUTION_TYPE_SEGMENT"] = 0] = "COLOR_DISTRIBUTION_TYPE_SEGMENT";
    /**
     * Colors distributed along the line ingoring the segments
     */
    GreasedLineMeshColorDistributionType[GreasedLineMeshColorDistributionType["COLOR_DISTRIBUTION_TYPE_LINE"] = 1] = "COLOR_DISTRIBUTION_TYPE_LINE";
})(GreasedLineMeshColorDistributionType || (GreasedLineMeshColorDistributionType = {}));
//# sourceMappingURL=greasedLineMaterialInterfaces.js.map