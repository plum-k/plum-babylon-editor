import {type PBRMaterial} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isPBRMaterial(value: any): value is PBRMaterial {
    return invoke(value, "getClassName") === "PBRMaterial";
}

