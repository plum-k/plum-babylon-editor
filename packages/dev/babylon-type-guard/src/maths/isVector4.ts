import {Vector4} from "@babylonjs/core";

export function isVector4(value: any): value is Vector4 {
    return value instanceof Vector4;
}

