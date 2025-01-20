import {type SpotLight} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isSpotLight(value: any): value is SpotLight {
    return invoke(value, "getClassName") === "SpotLight";
}


