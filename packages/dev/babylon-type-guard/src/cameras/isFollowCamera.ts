import {type FollowCamera} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isFollowCamera(value: any): value is FollowCamera {
    return invoke(value, "getClassName") === "FollowCamera";
}