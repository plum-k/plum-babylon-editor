import {type  ArcFollowCamera} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isArcFollowCamera(value: any): value is ArcFollowCamera {
    return invoke(value, "getClassName") === "ArcFollowCamera";
}
