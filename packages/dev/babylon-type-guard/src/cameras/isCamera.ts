import {type Camera} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isCamera(value: any): value is Camera {
    return invoke(value, "getClassName") === "Camera";
}

