import { AxesViewer } from "../Debug/axesViewer.js";
import { Vector3 } from "../Maths/math.vector.js";
import { Axis } from "../Maths/math.axis.js";
/**
 * The BoneAxesViewer will attach 3 axes to a specific bone of a specific mesh
 * @see demo here: https://www.babylonjs-playground.com/#0DE8F4#8
 */
export class BoneAxesViewer extends AxesViewer {
    /**
     * Creates a new BoneAxesViewer
     * @param scene defines the hosting scene
     * @param bone defines the target bone
     * @param mesh defines the target mesh
     * @param scaleLines defines a scaling factor for line length (1 by default)
     */
    constructor(scene, bone, mesh, scaleLines = 1) {
        super(scene, scaleLines);
        /** Gets current position */
        this.pos = Vector3.Zero();
        /** Gets direction of X axis */
        this.xaxis = Vector3.Zero();
        /** Gets direction of Y axis */
        this.yaxis = Vector3.Zero();
        /** Gets direction of Z axis */
        this.zaxis = Vector3.Zero();
        this.mesh = mesh;
        this.bone = bone;
    }
    /**
     * Force the viewer to update
     */
    update() {
        if (!this.mesh || !this.bone) {
            return;
        }
        const bone = this.bone;
        bone.getAbsolutePositionToRef(this.mesh, this.pos);
        bone.getDirectionToRef(Axis.X, this.mesh, this.xaxis);
        bone.getDirectionToRef(Axis.Y, this.mesh, this.yaxis);
        bone.getDirectionToRef(Axis.Z, this.mesh, this.zaxis);
        super.update(this.pos, this.xaxis, this.yaxis, this.zaxis);
    }
    /** Releases resources */
    dispose() {
        if (this.mesh) {
            this.mesh = null;
            this.bone = null;
            super.dispose();
        }
    }
}
//# sourceMappingURL=boneAxesViewer.js.map