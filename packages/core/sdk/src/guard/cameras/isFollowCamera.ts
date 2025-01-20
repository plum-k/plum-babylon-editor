import {FollowCamera} from "@babylonjs/core";

export function isFollowCamera(value: any): value is FollowCamera {
    return value instanceof FollowCamera;
}