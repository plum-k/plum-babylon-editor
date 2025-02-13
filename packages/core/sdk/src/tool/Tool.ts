import {Color4} from "@babylonjs/core";

export class Tool {
   static color4FromArray(color: Color4 | number[]) {
        return Array.isArray(color) ? Color4.FromArray(color) : color;
    }
}