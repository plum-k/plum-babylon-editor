import {HemisphericLight} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isHemisphericLight(value: any): value is HemisphericLight {
    return invoke(value, "getClassName") === "HemisphericLight";
}


