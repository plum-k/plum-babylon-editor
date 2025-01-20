import {type Mesh} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isMesh(value: any): value is Mesh {
    return invoke(value, "getClassName") === "Mesh";
}


