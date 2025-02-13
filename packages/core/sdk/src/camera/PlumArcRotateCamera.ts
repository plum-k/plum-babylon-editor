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
}

RegisterClass("PlumArcRotateCamera", PlumArcRotateCamera);

export function isPlumArcRotateCamera(value: any): value is PlumArcRotateCamera {
    return value instanceof PlumArcRotateCamera;
}
