import {Color3,Engine,Scene ,HavokPlugin,Vector3,FollowCamera,
    MeshBuilder,Vector4,Physics6DoFConstraint,PhysicsConstraintAxis,PhysicsConstraintMotorType,
    HemisphericLight,KeyboardEventTypes,PhysicsShapeMesh,StandardMaterial,Texture,PhysicsBody,PhysicsShapeCylinder,PhysicsMotionType } from "@babylonjs/core";

let havokInstance = null;
let tyreMaterial;
const debugColours = [];
debugColours[0] = new Color3(1, 0, 1);
debugColours[1] = new Color3(1, 0, 0);
debugColours[2] = new Color3(0, 1, 0);
debugColours[3] = new Color3(1, 1, 0);
debugColours[4] = new Color3(0, 1, 1);
debugColours[5] = new Color3(0, 0, 1);
const FILTERS = { CarParts: 1, Environment: 2 }

async function createScene() {
    const engine = new Engine(canvas);
    scene = new Scene(engine);

    havokInstance = new HavokPlugin(false);
    scene.enablePhysics(new Vector3(0, -240, 0), havokInstance);
    scene.getPhysicsEngine().setTimeStep(1 / 500);
    //
    // NOTE: To change the speed of the simulation without distoring the physics too much, leave the setTimeStep and 
    // update the setSubTimeStep (only the case when HavokPlugin() _useDeltaForWorldStep is set to false)
    //
    scene.getPhysicsEngine().setSubTimeStep(4.5);

    const camera = new FollowCamera("FollowCam", new Vector3(0, 10, -10), scene);
    camera.radius = 50;
    camera.heightOffset = 20;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.035;
    camera.maxCameraSpeed = 10;

    const hemisphericLight = new HemisphericLight("Hemispheric Light", new Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 0.7;

    InitTyreMaterial();
    CreateGroundAndWalls();
    camera.lockedTarget = CreateCar();

    engine.runRenderLoop(() => {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });

    return scene;
}

function CreateCar() {
    const carFrame = MeshBuilder.CreateBox("Frame", { height: 1, width: 12, depth: 24, faceColors: debugColours });
    carFrame.position = new Vector3(0, 0.3, 0);
    carFrame.visibility = 0.5;
    const carFrameBody = AddDynamicPhysics(carFrame, 1000, 0, 0);
    FilterMeshCollisions(carFrame);

    const flWheel = CreateWheel(new Vector3(5, 0, 8));
    const flAxle = CreateAxle(new Vector3(5, 0, 8));
    const frWheel = CreateWheel(new Vector3(-5, 0, 8));
    const frAxle = CreateAxle(new Vector3(-5, 0, 8));
    const rlWheel = CreateWheel(new Vector3(5, 0, -8));
    const rlAxle = CreateAxle(new Vector3(5, 0, -8));
    const rrWheel = CreateWheel(new Vector3(-5, 0, -8));
    const rrAxle = CreateAxle(new Vector3(-5, 0, -8));

    for (const mesh of [flAxle, frAxle, rlAxle, rrAxle]) {
        carFrame.addChild(mesh);
        AddAxlePhysics(mesh, 100, 0, 0);
        FilterMeshCollisions(mesh);
    }

    for (const mesh of [flWheel, frWheel, rlWheel, rrWheel]) {
        AddWheelPhysics(mesh, 100, 0.1, 50);
        FilterMeshCollisions(mesh);
    }

    const poweredWheelMotorA = CreatePoweredWheelJoint(flAxle, flWheel);
    const poweredWheelMotorB = CreatePoweredWheelJoint(frAxle, frWheel);
    CreateWheelJoint(rlAxle, rlWheel);
    CreateWheelJoint(rrAxle, rrWheel);

    const steerWheelA = AttachAxleToFrame(flAxle.physicsBody, carFrameBody, true);
    const steerWheelB = AttachAxleToFrame(frAxle.physicsBody, carFrameBody, true);
    AttachAxleToFrame(rlAxle.physicsBody, carFrameBody);
    AttachAxleToFrame(rrAxle.physicsBody, carFrameBody);

    InitKeyboardControls(poweredWheelMotorA, poweredWheelMotorB, steerWheelA, steerWheelB);

    return carFrame;
}

function CreateAxle(position) {
    const axleMesh = MeshBuilder.CreateBox("Axle", { height: 1, width: 2.5, depth: 1, faceColors: debugColours });
    axleMesh.position = position;

    return axleMesh;
}

function CreateWheel(position) {
    const faceUVforArrowTexture = [
        new Vector4(0, 0, 0, 0),
        new Vector4(0, 1, 1, 0),
        new Vector4(0, 0, 0, 0),
    ]

    const wheelMesh = MeshBuilder.CreateCylinder("Wheel", { height: 1.6, diameter: 4, faceUV: faceUVforArrowTexture });
    wheelMesh.rotation = new Vector3(0, 0, Math.PI / 2);
    // 
    // NOTE: The rotation of the wheel is baked here so that future rotations 
    // get a clean slate (makes setting up constraints much easier)
    //
    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position = position;

    wheelMesh.material = tyreMaterial;

    return wheelMesh;
}

function AttachAxleToFrame(axle, frame, hasSteering) {
    const aPos = axle.transformNode.position;

    const joint = new Physics6DoFConstraint(
        {
            pivotA: new Vector3(0, 0, 0),
            pivotB: new Vector3(aPos.x, aPos.y, aPos.z),
        },
        //
        // NOTE: The following limit settings provide suspension (axis LINEAR_Y), some angular leeway (ANGULAR_X, ANGULAR_Z), 
        // and freedom to steer if required (ANGULAR_Y)
        //
        [
            {
                axis: PhysicsConstraintAxis.LINEAR_X,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.LINEAR_Y,
                minLimit: -0.15,
                maxLimit: 0.15,
                stiffness: 100000,
                damping: 5000
            },
            {
                axis: PhysicsConstraintAxis.LINEAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_X,
                minLimit: -0.25,
                maxLimit: 0.25,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: hasSteering ? null : 0,
                maxLimit: hasSteering ? null : 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: -0.05,
                maxLimit: 0.05,
            },
        ],
        scene
    );

    axle.addConstraint(frame, joint);

    if (hasSteering)
        AttachSteering(joint);

    return joint;
}

function CreateWheelJoint(axle, wheel) {
    const motorJoint = new Physics6DoFConstraint(
        {},
        [
            {
                axis: PhysicsConstraintAxis.LINEAR_DISTANCE,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
        ],
        scene
    );

    axle.addChild(wheel);
    axle.physicsBody.addConstraint(wheel.physicsBody, motorJoint);

    return motorJoint;
}

function CreatePoweredWheelJoint(axle, wheel) {
    const motorJoint = CreateWheelJoint(axle, wheel);

    motorJoint.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintMotorType.VELOCITY);
    //
    // NOTE: setAxisMotorMaxForce acts as torque here (strength of wheel getting to target speed)
    //
    motorJoint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, 180000);
    motorJoint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, 0);

    return motorJoint;
}

function AttachSteering(joint) {
    joint.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_Y, PhysicsConstraintMotorType.POSITION);
    //
    // NOTE: setAxisMotorMaxForce acts like power steering here (strength of wheel getting to target steering angle)
    //
    joint.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_Y, 30000000);
    joint.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, 0);

    return joint;
}

function InitKeyboardControls(motorWheelA, motorWheelB, steerWheelA, steerWheelB) {
    let forwardPressed = false;
    let backPressed = false;
    let leftPressed = false;
    let rightPressed = false;
    let brakePressed = false;

    let currentSpeed = 0;
    let currentSteeringAngle = 0;
    let maxSpeed = 150;
    const maxSteeringAngle = Math.PI / 6;

    scene.onKeyboardObservable.add(e => {
        switch (e.event.key) {
            case "w": case "W": case "ArrowUp": forwardPressed = e.type == KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "s": case "S": case "ArrowDown": backPressed = e.type == KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "a": case "A": case "ArrowLeft": leftPressed = e.type == KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "d": case "D": case "ArrowRight": rightPressed = e.type == KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case " ": brakePressed = e.type == KeyboardEventTypes.KEYDOWN ? true : false;
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (leftPressed && currentSteeringAngle < maxSteeringAngle) {
            currentSteeringAngle += 0.01;
        } else if (rightPressed && currentSteeringAngle > -maxSteeringAngle) {
            currentSteeringAngle -= 0.01;
        } else if (!leftPressed && !rightPressed) {
            currentSteeringAngle *= 0.98;
        }

        const [innerAngle, outerAngle] = CalculateWheelAngles(currentSteeringAngle);
        steerWheelA.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, outerAngle);
        steerWheelB.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_Y, innerAngle);

        if (brakePressed) {
            currentSpeed = 0;
        } else if (forwardPressed && currentSpeed < maxSpeed) {
            currentSpeed += 8;
        } else if (backPressed && currentSpeed > -maxSpeed * 0.5) {
            currentSpeed -= 8;
        } else if (!forwardPressed && !backPressed) {
            currentSpeed *= 0.99;
        }

        motorWheelA.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, currentSpeed);
        motorWheelB.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, currentSpeed);
    });
}

function InitTyreMaterial() {
    tyreMaterial = new StandardMaterial("Tyre", scene);
    const upTexture = new Texture("textures/up.png", scene);
    upTexture.wAng = -Math.PI / 2;
    upTexture.vScale = 0.4;
    tyreMaterial.diffuseTexture = upTexture;
}

function CreateGroundAndWalls() {
    const groundMaterial = new StandardMaterial("Ground Material", scene);
    const checkerboard = new Texture("textures/amiga.jpg", scene);
    checkerboard.uScale = 20;
    checkerboard.vScale = 20;
    groundMaterial.diffuseTexture = checkerboard;

    const ground = MeshBuilder.CreateGround("Ground", { height: 500, width: 500 });
    ground.material = groundMaterial;
    ground.position = new Vector3(0, -10, 0);
    AddStaticPhysics(ground, 300);

    const wallA = MeshBuilder.CreateBox("Wall", { height: 20, width: 500, depth: 1 });
    wallA.position = new Vector3(0, 0, 250);
    AddStaticPhysics(wallA, 300);

    const wallB = MeshBuilder.CreateBox("Wall", { height: 20, width: 500, depth: 1 });
    wallB.position = new Vector3(0, 0, -250);
    AddStaticPhysics(wallB, 300);

    const wallC = MeshBuilder.CreateBox("Wall", { height: 20, width: 1, depth: 500 });
    wallC.position = new Vector3(250, 0, 0);
    AddStaticPhysics(wallC, 300);

    const wallD = MeshBuilder.CreateBox("Wall", { height: 20, width: 1, depth: 500 });
    wallD.position = new Vector3(-250, 0, 0);
    AddStaticPhysics(wallD, 300);
}

function AddWheelPhysics(mesh, mass, bounce, friction) {
    const physicsShape = new PhysicsShapeCylinder(new Vector3(-0.8, 0, 0), new Vector3(0.8, 0, 0), 2, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

function AddAxlePhysics(mesh, mass, bounce, friction) {
    //
    // NOTE: Making the axle shape similar dimensions to the wheel shape increases stability of the joint when it is added
    //
    const physicsShape = new PhysicsShapeCylinder(new Vector3(-0.8, 0, 0), new Vector3(0.8, 0, 0), 1.8, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

function AddDynamicPhysics(mesh, mass, bounce, friction) {
    const physicsShape = new PhysicsShapeMesh(mesh, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

function AddStaticPhysics(mesh, friction) {
    const physicsShape = new PhysicsShapeMesh(mesh, scene);
    const physicsBody = new PhysicsBody(mesh, PhysicsMotionType.STATIC, false, scene);
    physicsShape.material = { restitution: 0, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

function FilterMeshCollisions(mesh) {
    mesh.physicsBody.shape.filterMembershipMask = FILTERS.CarParts,
        mesh.physicsBody.shape.filterCollideMask = FILTERS.Environment
}

function CalculateWheelAngles(averageAngle) {
    //
    // NOTE: This is needed because of https://en.wikipedia.org/wiki/Ackermann_steering_geometry
    //
    const wheelbase = 16;
    const trackWidth = 11;

    const avgRadius = wheelbase / Math.tan(averageAngle);
    const innerRadius = avgRadius - trackWidth / 2;
    const outerRadius = avgRadius + trackWidth / 2;
    const innerAngle = Math.atan(wheelbase / innerRadius);
    const outerAngle = Math.atan(wheelbase / outerRadius);

    return [innerAngle, outerAngle];
}