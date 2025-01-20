/**
 * Determines how values from the PhysicsMaterial are combined when
 * two objects are in contact. When each PhysicsMaterial specifies
 * a different combine mode for some property, the combine mode which
 * is used will be selected based on their order in this enum - i.e.
 * a value later in this list will be preferentially used.
 */
export var PhysicsMaterialCombineMode;
(function (PhysicsMaterialCombineMode) {
    /**
     * The final value will be the geometric mean of the two values:
     * sqrt( valueA *  valueB )
     */
    PhysicsMaterialCombineMode[PhysicsMaterialCombineMode["GEOMETRIC_MEAN"] = 0] = "GEOMETRIC_MEAN";
    /**
     * The final value will be the smaller of the two:
     * min( valueA , valueB )
     */
    PhysicsMaterialCombineMode[PhysicsMaterialCombineMode["MINIMUM"] = 1] = "MINIMUM";
    /* The final value will be the larger of the two:
     * max( valueA , valueB )
     */
    PhysicsMaterialCombineMode[PhysicsMaterialCombineMode["MAXIMUM"] = 2] = "MAXIMUM";
    /* The final value will be the arithmetic mean of the two values:
     * (valueA + valueB) / 2
     */
    PhysicsMaterialCombineMode[PhysicsMaterialCombineMode["ARITHMETIC_MEAN"] = 3] = "ARITHMETIC_MEAN";
    /**
     * The final value will be the product of the two values:
     * valueA * valueB
     */
    PhysicsMaterialCombineMode[PhysicsMaterialCombineMode["MULTIPLY"] = 4] = "MULTIPLY";
})(PhysicsMaterialCombineMode || (PhysicsMaterialCombineMode = {}));
//# sourceMappingURL=physicsMaterial.js.map