import {Color4, ConeParticleEmitter, ParticleSystem,Texture, Vector3, Viewer,NoiseProceduralTexture} from "@plum-render/babylon-sdk";

let viewer = await Viewer.create("app", {
    isCreateDefaultLight: true,
    isCreateDefaultEnvironment: true,
});
let scene = viewer.scene;

viewer.initSubject.subscribe(() => {
    console.log("场景初始化完成");
})

