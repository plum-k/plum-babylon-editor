import {type Color3} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isColor3(value: any): value is Color3 {
    return invoke(value, "getClassName") === "Color3";
}


