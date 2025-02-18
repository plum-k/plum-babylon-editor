import {Color4, Vector3} from "@babylonjs/core";

export class Tool {
    static color4FromArray(color: Color4 | number[]) {
        return Array.isArray(color) ? Color4.FromArray(color) : color;
    }
    static toVector3(value: Vector3 | number[]) {
        return Array.isArray(value) ? Vector3.FromArray(value) : value;
    }
}