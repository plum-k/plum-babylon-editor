import {type Color4} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isColor4(value: any): value is Color4 {
    return invoke(value, "getClassName") === "Color4";
}


