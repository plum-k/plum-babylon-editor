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
import {MeshBuilder, PlumArcRotateCamera} from "../index";
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
        // TODO 调试相机
        // this.debugCamera();
    }

    createDefaultCamera(radius = 10) {
        if (isNil(this.scene.activeCamera)) {
            let worldCenter = new Vector3(0, 0, 0);
            const arcRotateCamera = new PlumArcRotateCamera("default camera", -(Math.PI / 2), Math.PI / 2, radius, worldCenter, this.scene);
            arcRotateCamera.lowerRadiusLimit = radius * 0.01;
            arcRotateCamera.wheelPrecision = 100 / radius;
            arcRotateCamera.minZ = radius * 0.01;
            arcRotateCamera.maxZ = radius * 1000;
            arcRotateCamera.speed = radius * 0.2;
            // 禁用双击恢复视角
            arcRotateCamera.useInputToRestoreState=false;

            this.scene.activeCamera = arcRotateCamera;
            arcRotateCamera.attachControl();
            console.log(arcRotateCamera.position)
            arcRotateCamera.setPosition(new Vector3(10,10,10));

            // Object.defineProperty(arcRotateCamera, 'radius', {
            //     get: ()=> {
            //         return 10
            //     },
            //     set: (newValue) =>{
            //         console.log(new Error())
            //         // arcRotateCamera.radius = newValue;
            //         console.log('属性 prop 发生了变化，新值为:', newValue);
            //     }
            // });
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
