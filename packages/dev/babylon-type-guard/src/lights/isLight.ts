import {type Light} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isLight(value: any): value is Light {
    return invoke(value, "getClassName") === "Light";
}

