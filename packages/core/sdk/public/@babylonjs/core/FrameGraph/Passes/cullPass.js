import { FrameGraphPass } from "./pass.js";
/**
 * Cull pass used to filter objects that are not visible.
 */
export class FrameGraphCullPass extends FrameGraphPass {
    /**
     * Checks if a pass is a cull pass.
     * @param pass The pass to check.
     * @returns True if the pass is a cull pass, else false.
     */
    static IsCullPass(pass) {
        return pass.setObjectList !== undefined;
    }
    /**
     * Gets the object list used by the cull pass.
     */
    get objectList() {
        return this._objectList;
    }
    /**
     * Sets the object list to use for culling.
     * @param objectList The object list to use for culling.
     */
    setObjectList(objectList) {
        this._objectList = objectList;
    }
    /** @internal */
    constructor(name, parentTask, context, engine) {
        super(name, parentTask, context);
        this._engine = engine;
    }
    /** @internal */
    _isValid() {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._objectList !== undefined ? null : "Object list is not set (call setObjectList to set it)";
    }
}
//# sourceMappingURL=cullPass.js.map