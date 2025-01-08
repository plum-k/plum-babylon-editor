import {BasePlum, IBasePlumOptions} from "./BasePlum";
import {isArcRotateCamera} from "babylon-is";
import {
    AbstractMesh,
    ArcRotateCamera,
    Color3,
    FramingBehavior,
    Mesh,
    PBRMaterial,
    UtilityLayerRenderer,
    Vector3
} from "@babylonjs/core";
import {MeshBuilder} from "../index";
import {isNil} from "lodash-es";


export interface ICameraControlsOptions extends IBasePlumOptions {
}


export class CameraControls extends BasePlum {
    // width: number;
    // height: number;
    // camera: FreeCamera

    debugBox: Mesh | null = null;

    constructor(options: ICameraControlsOptions) {
        super(options);
        const {viewer} = options;
        const {scene, canvas} = viewer

        this.createDefaultCamera();

        // this.scene.activeCamera!.position.set(10, 10, 0);

        console.log(this.scene.activeCamera!.position)

        // this.scene.activeCamera!.attachControl();
        // 禁用平移
        // this.scene.activeCamera.panningSensibility = 0;
        // this.scene.activeCamera!.inputs.remove();

        // this.scene.createDefaultCameraOrLight(true, true, true);
        // @ts-ignore
        // this.scene.activeCamera.alpha += Math.PI;
        // this.camera = new FreeCamera("camera", new Vector3(0, 5, -10), scene);
        // this.camera.setTarget(Vector3.Zero());
        // this.camera.attachControl(canvas, true);
        // this.prepareCamera();
        // @ts-ignore
        // this.scene.activeCamera.radius = 20;


        // const camera = this.scene.activeCamera as ArcRotateCamera;


        // 更新 相继位置
        // window.test = (num)=>{
        //     console.log(camera.inertialPanningX)
        //     camera.inertialPanningX += num;
        // }


        // camera.inputs.remove(camera.inputs.attached.pointers)
        // let customPointersInput  = new CustomPointersInput()
        // camera.inputs.add(customPointersInput)
        //
        // camera.detachControl()
        // camera.attachControl(canvas, true)

        // camera.zoomToMouseLocation = true;
        // camera.wheelDeltaPercentage = 0.01

        // TODO 调试相机
        // this.debugCamera();
    }

    createDefaultCamera(radius = 10) {
        if (isNil(this.scene.activeCamera)) {
            let worldCenter = new Vector3(0, 0, 0);
            const arcRotateCamera = new ArcRotateCamera("default camera", -(Math.PI / 2), Math.PI / 2, radius, worldCenter, this.scene);
            arcRotateCamera.lowerRadiusLimit = radius * 0.01;
            arcRotateCamera.wheelPrecision = 100 / radius;
            arcRotateCamera.minZ = radius * 0.01;
            arcRotateCamera.maxZ = radius * 1000;
            arcRotateCamera.speed = radius * 0.2;
            this.scene.activeCamera = arcRotateCamera;
            arcRotateCamera.attachControl();
        }
    }

    initDebugBox() {
        const backScene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;
        this.debugBox = MeshBuilder.CreateBox('debugBox', {}, backScene);
        const boxMaterial = new PBRMaterial("material", backScene);
        boxMaterial.albedoColor = new Color3(1, 0, 0);
        boxMaterial.disableDepthWrite = false;

        this.debugBox.material = boxMaterial;
    }


    debugCamera() {
        this.scene.onAfterCameraRenderObservable.add(() => {
            const camera = this.scene.activeCamera as ArcRotateCamera;
            const target = camera.target;
            if (this.debugBox) {
                this.debugBox.position = target;
            } else {
                this.initDebugBox();
            }
        })
    }


    zoomOn(meshes: AbstractMesh[], doNotUpdateMaxZ = true) {
        let camera = this.scene.activeCamera;
        if (isArcRotateCamera(camera)) {
            camera.zoomOn(meshes, doNotUpdateMaxZ);
            // this.zoomOnBoundingInfo(mesh[0])
        }
    }

    /**
     * 聚焦到指定的网格
     * @param meshes 网格
     * @param doNotUpdateMaxZ
     */
    focusOn(meshes: AbstractMesh[], doNotUpdateMaxZ = true) {
        let camera = this.scene.activeCamera;
        if (isArcRotateCamera(camera)) {
            // todo 裁剪距离被修改, 但半径不会被修改
            camera.focusOn(meshes, doNotUpdateMaxZ);
            // this.zoomOnBoundingInfo(mesh[0])
        }
    }

    zoomOnBoundingInfo(mesh: AbstractMesh) {
        // const worldExtends = this.scene.getWorldExtends(function (mesh) {
        //     return mesh.isVisible && mesh.isEnabled();
        // });

        const worldExtends = mesh.getBoundingInfo().boundingBox;

        const camera = this.scene.activeCamera! as unknown as ArcRotateCamera;
        const framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.zoomOnBoundingInfo(worldExtends.minimumWorld, worldExtends.maximumWorld);
    }


    // 聚焦到场景
    focusToScene() {
        const camera = this.scene.activeCamera! as unknown as ArcRotateCamera;

        // Enable camera's behaviors
        // todo 双击会重置位置
        camera.useFramingBehavior = true;

        const framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        camera.lowerRadiusLimit = null;

        const worldExtends = this.scene.getWorldExtends((mesh) => {
            return mesh.isVisible && mesh.isEnabled();
        });
        framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
    }
}
