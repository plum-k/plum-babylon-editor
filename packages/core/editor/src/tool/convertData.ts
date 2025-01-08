import {Color3, Tools, Vector3} from "@babylonjs/core";

export function color3ToForm(value: Color3) {
    return value.toHexString()
}

export function vector3RotationToForm(value: Vector3) {
    return {
        x: Tools.ToDegrees(value.x),
        y: Tools.ToDegrees(value.y),
        z: Tools.ToDegrees(value.z)
    }
}

