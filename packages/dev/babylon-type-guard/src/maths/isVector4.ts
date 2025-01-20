import {type Vector4} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isVector4(value: any): value is Vector4 {
    return invoke(value, "getClassName") === "Vector4";
}

