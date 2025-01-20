import { Vector3, Matrix } from "../Maths/math.vector.js";
/**
 * Class containing a set of static utilities functions for managing Pivots
 * @internal
 */
export class PivotTools {
    /**
     * @internal
     */
    static _RemoveAndStorePivotPoint(mesh) {
        if (mesh && PivotTools._PivotCached === 0) {
            // Save old pivot and set pivot to 0,0,0
            mesh.getPivotPointToRef(PivotTools._OldPivotPoint);
            PivotTools._PivotPostMultiplyPivotMatrix = mesh._postMultiplyPivotMatrix;
            if (!PivotTools._OldPivotPoint.equalsToFloats(0, 0, 0)) {
                mesh.setPivotMatrix(Matrix.IdentityReadOnly);
                PivotTools._OldPivotPoint.subtractToRef(mesh.getPivotPoint(), PivotTools._PivotTranslation);
                PivotTools._PivotTmpVector.copyFromFloats(1, 1, 1);
                PivotTools._PivotTmpVector.subtractInPlace(mesh.scaling);
                PivotTools._PivotTmpVector.multiplyInPlace(PivotTools._PivotTranslation);
                mesh.position.addInPlace(PivotTools._PivotTmpVector);
            }
        }
        PivotTools._PivotCached++;
    }
    /**
     * @internal
     */
    static _RestorePivotPoint(mesh) {
        if (mesh && !PivotTools._OldPivotPoint.equalsToFloats(0, 0, 0) && PivotTools._PivotCached === 1) {
            mesh.setPivotPoint(PivotTools._OldPivotPoint);
            mesh._postMultiplyPivotMatrix = PivotTools._PivotPostMultiplyPivotMatrix;
            PivotTools._PivotTmpVector.copyFromFloats(1, 1, 1);
            PivotTools._PivotTmpVector.subtractInPlace(mesh.scaling);
            PivotTools._PivotTmpVector.multiplyInPlace(PivotTools._PivotTranslation);
            mesh.position.subtractInPlace(PivotTools._PivotTmpVector);
        }
        this._PivotCached--;
    }
}
// Stores the state of the pivot cache (_oldPivotPoint, _pivotTranslation)
// store/remove pivot point should only be applied during their outermost calls
PivotTools._PivotCached = 0;
PivotTools._OldPivotPoint = new Vector3();
PivotTools._PivotTranslation = new Vector3();
PivotTools._PivotTmpVector = new Vector3();
PivotTools._PivotPostMultiplyPivotMatrix = false;
//# sourceMappingURL=pivotTools.js.map