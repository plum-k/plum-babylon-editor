import {HavokPlugin, initReservedDataStore, IPhysicsEnginePluginV2, MeshBuilder, PhysicsAggregate,
    PhysicsPrestepType, PhysicsShapeType, Quaternion, Vector3, Viewer} from "@plum-render/babylon-sdk";

export default async function testPhysics(viewer: Viewer,) {
    const scene = viewer.scene;
    const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
    sphere.position.y = 4;

    const ground = MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
    // 初始化物理插件
    await viewer.physics.init();

    // 给球体添加物理, 并设置其形状为球体,质量为1, 摩擦为0.75
    const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, {mass: 1, restitution: 0.75}, scene);
    initReservedDataStore(sphere)
    sphere.reservedDataStore.physicsAggregate = sphereAggregate

    // 给地面添加物理, 并设置其形状为球体,质量为0, 摩擦为0.75
    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);
    initReservedDataStore(ground)
    sphere.reservedDataStore.physicsAggregate = sphereAggregate

    // console.log(sphere)
    //  这个属性已经被废弃了
    // console.log(sphere.physicsImpostor)
    console.log(sphere.physicsBody)

    console.log(sphereAggregate)

    const box = MeshBuilder.CreateBox("box", {}, scene);
    box.position.z = 4;
    box.position.y = 4;
    // const boxAggregate = new PhysicsAggregate(box, PhysicsShapeType.SPHERE, {mass: 1, restitution: 0.75}, scene);
}
