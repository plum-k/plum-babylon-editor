import {FireParticle, Viewer} from "@plum-render/babylon-sdk";
import {ParticleHelper} from "@babylonjs/core";

let viewer = await Viewer.create("app", {
    isCreateDefaultLight: true,
    isCreateDefaultEnvironment: true,
});
