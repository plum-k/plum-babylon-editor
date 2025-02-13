import {ParticleSystem} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isParticleSystem(value: any): value is ParticleSystem {
    return invoke(value, "getClassName") === "ParticleSystem";
}

