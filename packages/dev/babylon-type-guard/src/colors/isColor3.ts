import {Color3} from "@babylonjs/core";

export function isColor3(value: any): value is Color3 {
    return value instanceof Color3;
}


