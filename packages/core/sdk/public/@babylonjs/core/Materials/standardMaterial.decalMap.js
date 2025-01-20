import { DecalMapConfiguration } from "./material.decalMapConfiguration.js";
import { StandardMaterial } from "./standardMaterial.js";
Object.defineProperty(StandardMaterial.prototype, "decalMap", {
    get: function () {
        if (!this._decalMap) {
            if (this._uniformBufferLayoutBuilt) {
                // Material already used to display a mesh, so it's invalid to add the decal map plugin at that point
                // Returns null instead of having new DecalMapConfiguration throws an exception
                return null;
            }
            this._decalMap = new DecalMapConfiguration(this);
        }
        return this._decalMap;
    },
    enumerable: true,
    configurable: true,
});
//# sourceMappingURL=standardMaterial.decalMap.js.map