import {Material} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isMaterial(value: any): value is Material {
    return invoke(value, "getClassName") === "Material";
}

