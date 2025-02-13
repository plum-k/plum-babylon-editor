import {DirectionalLight} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isDirectionalLight(value: any): value is DirectionalLight {
    return invoke(value, "getClassName") === "DirectionalLight";
}

