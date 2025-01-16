import {Color4} from "@babylonjs/core";

export function isColor4(value: any): value is Color4 {
    return value instanceof Color4;
}


