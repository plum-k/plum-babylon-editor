import {type Vector3} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isVector3(value: any): value is Vector3 {
    return invoke(value, "getClassName") === "Vector3";
}

