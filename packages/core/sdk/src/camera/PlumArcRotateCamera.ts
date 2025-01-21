import {ArcRotateCamera, RegisterClass, Scene, Vector3} from "@babylonjs/core";
import {PlumArcRotateCameraPointersInput} from "./PlumArcRotateCameraPointersInput";

export class PlumArcRotateCamera extends ArcRotateCamera {
    constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene?: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, alpha, beta, radius, target, scene, setActiveOnSceneIfNoneActive);
        this.inputs.removeByType("ArcRotateCameraPointersInput");
        this.inputs.add(new PlumArcRotateCameraPointersInput());
        this.wheelDeltaPercentage = 0.01;
        this.panningSensibility = 15000;
    }
}

RegisterClass("PlumArcRotateCamera", PlumArcRotateCamera);

export function isPlumArcRotateCamera(value: any): value is PlumArcRotateCamera {
    return value instanceof PlumArcRotateCamera;
}
