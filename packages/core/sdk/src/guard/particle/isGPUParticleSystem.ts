import {GPUParticleSystem} from "@babylonjs/core";
import {invoke} from "lodash-es";

export function isGPUParticleSystem(value: any): value is GPUParticleSystem {
    return invoke(value, "getClassName") === "GPUParticleSystem";
}

