import {type FlyCamera} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isFlyCamera(value: any): value is FlyCamera {
    return invoke(value, "getClassName") === "FlyCamera";
}