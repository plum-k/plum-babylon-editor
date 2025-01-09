import {
    Color3,
    Color4,
    MeshBuilder,
    MeshParticleEmitter,
    ParticleSystem,
    PhysicsAggregate,
    PhysicsShapeType,
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

viewer.initSubject.subscribe(() => {
    console.log("场景初始化完成");
})

const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
sphere.position.y = 4;

const ground = MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);

// 初始化物理插件
await viewer.physics.init();

// 给球体添加物理, 并设置其形状为球体,质量为1, 摩擦为0.75
const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, {mass: 1, restitution: 0.75}, scene);
// 给地面添加物理, 并设置其形状为球体,质量为0, 摩擦为0.75
const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);
