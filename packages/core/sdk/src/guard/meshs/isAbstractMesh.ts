import {AbstractMesh} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isAbstractMesh(value: any): value is AbstractMesh {
    return invoke(value, "getClassName") === "AbstractMesh";
}


