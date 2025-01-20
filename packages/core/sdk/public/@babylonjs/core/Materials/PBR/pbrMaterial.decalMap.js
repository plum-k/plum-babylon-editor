import { DecalMapConfiguration } from "../material.decalMapConfiguration.js";
import { PBRBaseMaterial } from "./pbrBaseMaterial.js";
Object.defineProperty(PBRBaseMaterial.prototype, "decalMap", {
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
//# sourceMappingURL=pbrMaterial.decalMap.js.map