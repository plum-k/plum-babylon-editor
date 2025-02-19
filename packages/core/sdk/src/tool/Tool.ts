import {Color3, Color4, Vector3} from "@babylonjs/core";

export type Vector3Type = Vector3 | number[];
export type Color3Type = Color3 | number[];
export type Color4Type = Color4 | number[];

export class Tool {
    static color4FromArray(color: Color4Type) {
        return Array.isArray(color) ? Color4.FromArray(color) : color;
    }

    static color3FromArray(color: Color3Type) {
        return Array.isArray(color) ? Color3.FromArray(color) : color;
    }

    static toVector3(value: Vector3Type) {
        return Array.isArray(value) ? Vector3.FromArray(value) : value;
    }
}