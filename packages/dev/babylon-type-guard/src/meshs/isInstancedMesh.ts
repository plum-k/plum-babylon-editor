import {type InstancedMesh} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isInstancedMesh(value: any): value is InstancedMesh {
    return invoke(value, "getClassName") === "InstancedMesh";
}

