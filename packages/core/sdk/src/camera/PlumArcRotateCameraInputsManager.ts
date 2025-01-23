import {ArcRotateCameraInputsManager} from "@babylonjs/core";
import {PlumArcRotateCameraPointersInput} from "./PlumArcRotateCameraPointersInput";

export class PlumArcRotateCameraInputsManager extends ArcRotateCameraInputsManager {
    public addPointers(): ArcRotateCameraInputsManager {
        this.add(new PlumArcRotateCameraPointersInput());
        return this;
    }
}