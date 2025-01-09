import {
    Color3,
    Color4,
    MeshBuilder,
    MeshParticleEmitter,
    ParticleSystem,
    StandardMaterial,
    Texture,
    Vector3,
    Viewer,
} from "@plum-render/babylon-sdk";
import {Pane} from 'tweakpane';

let viewer = await Viewer.create("app", {
    isCreateDefaultLight: true,
    isCreateDefaultEnvironment: true,
});
let scene = viewer.scene;

// finalSize 最终粒子效果

viewer.initSubject.subscribe(() => {
    console.log("场景初始化完成");
})

let particleSystem

function createParticleSystem(callback) {

    if (particleSystem) {
        particleSystem.dispose();
    }
    particleSystem = new ParticleSystem("particles", 2000, scene);

    particleSystem.particleTexture = new Texture("/textures/flare.png", scene);

    callback();

    particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;

    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;

    particleSystem.emitRate = 1000;


    particleSystem.createPointEmitter(new Vector3(-7, 8, 3), new Vector3(7, 8, -3));

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.005;

    particleSystem.start();
}


createParticleSystem(() => {
    particleSystem.createPointEmitter(new Vector3(-7, 8, 3), new Vector3(7, 8, -3));
});
const pane = new Pane();

pane.addBlade({
    view: 'list',
    label: '发射器类型',
    options: [
        {text: '点', value: '点'},
        {text: '盒体', value: '盒体'},
        {text: '球体', value: '球体'},
        {text: '网格', value: '网格'},
    ],
    value: '点',
}).on('change', ({value}) => {

    if (value === '点') {
        createParticleSystem(() => {
            particleSystem.createPointEmitter(new Vector3(-7, 8, 3), new Vector3(7, 8, -3));
        });
    } else if (value === '盒体') {
        createParticleSystem(() => {
            particleSystem.createBoxEmitter(new Vector3(-5, 2, 1), new Vector3(5, 2, -1), new Vector3(-1, -2, -2.5), new Vector3(1, 2, 2.5));
        });
    } else if (value === '球体') {
        createParticleSystem(() => {
            particleSystem.createSphereEmitter(2);
        });
    } else if (value === '网格') {
        createParticleSystem(() => {
            const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);
            const sphereMat = new StandardMaterial("coreMat", scene)
            sphereMat.diffuseColor = new Color3(0.1, 0.1, 0.4);
            sphereMat.specularColor = Color3.Black();

            sphere.material = sphereMat;
            const meshEmitter = new MeshParticleEmitter(sphere);
            particleSystem.particleEmitterType = meshEmitter;
        });
    }
});



