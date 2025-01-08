import {Viewer} from "@plum-render/babylon-sdk";

let viewer = await Viewer.create("app");
viewer.debug(true);


let scene = viewer.scene;

let hero

let meshAssetTask = viewer.assetsManager.addMeshTask(`add`, "", "/", "Xbot.glb");
meshAssetTask.onSuccess = (task) => {
    console.log("模型加载成功")
    // 默认第一个网格是模型的根节点
    // mesh = task.loadedMeshes[0];
    console.log(task)
    // animationGroups[0].stop();
    task.loadedAnimationGroups[0].stop();

    hero = task.loadedMeshes[0];

    scene.activeCamera.target = hero;
}
// 开始加载模型
viewer.assetsManager.load();

// Ground
let ground = BABYLON.MeshBuilder.CreateGround("ground", {height: 50, width: 50, subdivisions: 4},);
let groundMaterial = new BABYLON.StandardMaterial("groundMaterial",);
groundMaterial.specularColor = new BABYLON.Color3(1, 0, 0);
ground.material = groundMaterial;


// Keyboard events
var inputMap = {};
// @ts-ignore
scene.actionManager = new BABYLON.ActionManager(viewer.scene);
// @ts-ignore
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
    // @ts-ignore
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));
// @ts-ignore
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
    // @ts-ignore
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
}));

let animating = true;


//Hero character variables
var heroSpeed = 0.03;
var heroSpeedBackwards = 0.01;
var heroRotationSpeed = 0.1;

scene.onBeforeRenderObservable.add(() => {
    var keydown = false;
    //Manage the movements of the character (e.g. position, direction)
    if (inputMap["w"]) {
        hero.moveWithCollisions(hero.forward.scaleInPlace(heroSpeed));
        keydown = true;
    }
    if (inputMap["s"]) {
        hero.moveWithCollisions(hero.forward.scaleInPlace(-heroSpeedBackwards));
        keydown = true;
    }
    if (inputMap["a"]) {
        hero.rotate(BABYLON.Vector3.Up(), -heroRotationSpeed);
        keydown = true;
    }
    if (inputMap["d"]) {
        hero.rotate(BABYLON.Vector3.Up(), heroRotationSpeed);
        keydown = true;
    }
    if (inputMap["b"]) {
        keydown = true;
    }

    //Manage animations to be played
    if (keydown) {
        if (!animating) {
            animating = true;
            if (inputMap["s"]) {
                //Walk backwards
                // walkBackAnim.start(true, 1.0, walkBackAnim.from, walkBackAnim.to, false);
            } else if (inputMap["b"]) {
                //Samba!
                // sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
            } else {
                //Walk
                // walkAnim.start(true, 1.0, walkAnim.from, walkAnim.to, false);

            }
        }
    } else {

        if (animating) {
            // 回到默认站立状态
            //Default animation is idle when no key is down
            // idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

            // 停止其他动画
            //Stop all animations besides Idle Anim when no key is down
            // sambaAnim.stop();
            // walkAnim.stop();
            // walkBackAnim.stop();

            //Ensure animation are played only once per rendering loop
            animating = false;
        }
    }
});