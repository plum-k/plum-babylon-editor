import {PointLight} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isPointLight(value: any): value is PointLight {
    return invoke(value, "getClassName") === "PointLight";
}


