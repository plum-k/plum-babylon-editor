import {HavokPlugin, IPhysicsEnginePluginV2, MeshBuilder, PhysicsAggregate,
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
    // 给地面添加物理, 并设置其形状为球体,质量为0, 摩擦为0.75
    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0}, scene);


    // console.log(sphere)
    //  这个属性已经被废弃了
    // console.log(sphere.physicsImpostor)
    console.log(sphere.physicsBody)

    console.log(sphereAggregate)

    window.test = ()=>{
        sphere.position.y = 4;
    }
    window.test1 = (a=1)=>{
        sphere.physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
        // sphere.physicsBody.setTargetTransform(new Vector3(0,a,0),new Quaternion());
        console.log(sphere.physicsBody.getPrestepType())
        sphere.position.y = 4;
        (scene.getPhysicsEngine().getPhysicsPlugin() as HavokPlugin).setPhysicsBodyTransformation(sphere.physicsBody,sphere);
        // sphere.position.y = 4;
        // sphere.physicsBody.setLinearVelocity(BABYLON.Vector3.Zero());
    }
    // sphere.physicsBody.disableSync = true

}
