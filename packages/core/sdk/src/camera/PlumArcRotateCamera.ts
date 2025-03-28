import {ArcRotateCamera, Node, RegisterClass, Scene, Vector3} from "@babylonjs/core";
import {PlumArcRotateCameraInputsManager} from "./PlumArcRotateCameraInputsManager";

Node.AddNodeConstructor("PlumArcRotateCamera", (name, scene) => {
    return () => new PlumArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), scene);
});

export class PlumArcRotateCamera extends ArcRotateCamera {
    constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene?: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, alpha, beta, radius, target, scene, setActiveOnSceneIfNoneActive);

        this.inputs.clear();
        this.inputs = new PlumArcRotateCameraInputsManager(this);
        this.inputs.addKeyboard().addMouseWheel().addPointers();

        this.wheelDeltaPercentage = 0.01;
        this.panningSensibility = 15000;
    }

    public override getClassName(): string {
        return "PlumArcRotateCamera";
    }

    topView() {
        this.alpha = Math.PI / 2; // 90 degrees
        this.beta = 0.1; // Almost 0, but with a small offset to avoid gimbal lock
    }

    bottomView() {
        this.alpha = Math.PI / 2; // 90 degrees
        this.beta = Math.PI - 0.1; // Almost 180 degrees
    }

    frontView() {
        this.alpha = Math.PI / 2; // 90 degrees
        this.beta = Math.PI / 2; // 90 degrees
    }

    backView() {
        this.alpha = -Math.PI / 2; // -90 degrees
        this.beta = Math.PI / 2; // 90 degrees
    }

    rightSideView() {
        this.alpha = 0; // 0 degrees
        this.beta = Math.PI / 2; // 90 degrees
    }

    leftSideView() {
        this.alpha = Math.PI; // 180 degrees
        this.beta = Math.PI / 2; // 90 degrees
    }
}

RegisterClass("PlumArcRotateCamera", PlumArcRotateCamera);

export function isPlumArcRotateCamera(value: any): value is PlumArcRotateCamera {
    return value instanceof PlumArcRotateCamera;
}
