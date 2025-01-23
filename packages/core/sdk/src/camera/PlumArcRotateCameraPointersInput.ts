import {ArcRotateCameraPointersInput, CameraInputTypes, Nullable, PointerTouch, Vector3} from "@babylonjs/core";

export class PlumArcRotateCameraPointersInput extends ArcRotateCameraPointersInput {
    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * @param point current touch point
     * @param offsetX offset on X
     * @param offsetY offset on Y
     */
    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        const distance = Vector3.Distance(this.camera.position, this.camera.target);
        // @ts-ignore
        if (this.panningSensibility !== 0 && ((this._ctrlKey && this.camera._useCtrlForPanning) || this._isPanClick)) {

            // 设置相机平移时, 考虑相机到目标的位置
            this.camera.inertialPanningX += (-offsetX * distance) / this.panningSensibility;
            this.camera.inertialPanningY += (offsetY * distance) / this.panningSensibility;
        } else {
            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
        }
    }

    public override getClassName(): string {
        return "PlumArcRotateCameraPointersInput";
    }
}

(<any>CameraInputTypes)["PlumArcRotateCameraPointersInput"] = PlumArcRotateCameraPointersInput;