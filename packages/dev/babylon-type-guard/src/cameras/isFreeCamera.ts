import {type FreeCamera} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isFreeCamera(value: any): value is FreeCamera {
    return invoke(value, "getClassName") === "FreeCamera";
}