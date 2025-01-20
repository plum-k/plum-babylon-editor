import {type ShadowLight} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isShadowLight(value: any): value is ShadowLight {
    return invoke(value, "getClassName") === "ShadowLight";
}


