import {Vector3} from "@babylonjs/core";

export function isVector3(value: any): value is Vector3 {
    return value instanceof Vector3;
}

