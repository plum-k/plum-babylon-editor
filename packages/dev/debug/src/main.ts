import {SmokeParticle, Viewer} from "@plum-render/babylon-sdk";

let viewer = await Viewer.create("app", {
    isCreateDefaultLight: true,
    isCreateDefaultEnvironment: true,
});

viewer.initSubject.subscribe(() => {
    console.log("场景初始化完成");
})

const smokeParticle = new SmokeParticle({
    name: "smoke",
    capacity: 1000,
    viewer: viewer
})
smokeParticle.build()
smokeParticle.start()