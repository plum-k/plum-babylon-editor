import {type ArcRotateCamera} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isArcRotateCamera(value: any): value is ArcRotateCamera {
    return invoke(value, "getClassName") === "ArcRotateCamera";
}
