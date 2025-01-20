import {BasePlum, IBasePlumOptions} from "./BasePlum";
import {isArcRotateCamera} from "../guard";
import {
    AbstractMesh,
    ArcRotateCamera,
    Color3,
    Mesh, MeshBuilder,
    Nullable,
    Observer,
    PBRMaterial,
    UtilityLayerRenderer,
    Vector3
} from "@babylonjs/core";
import {isNil} from "lodash-es";
import { PlumArcRotateCamera } from "../camera";


export interface ICameraControlsOptions extends IBasePlumOptions {
}


export class CameraControls extends BasePlum {
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
            arcRotateCamera.useInputToRestoreState = false;

            this.scene.activeCamera = arcRotateCamera;
            arcRotateCamera.attachControl();
            console.log(arcRotateCamera.position)
            arcRotateCamera.setPosition(new Vector3(10, 10, 10));

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
    debugBox: Mesh | null = null;
    debugCameraObserver: Nullable<Observer<any>> = null;

    initDebugBox() {
        const backScene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;
        this.debugBox = MeshBuilder.CreateBox('debugBox', {}, backScene);
        const boxMaterial = new PBRMaterial("material", backScene);
        boxMaterial.albedoColor = new Color3(1, 0, 0);
        boxMaterial.disableDepthWrite = false;
        this.debugBox.material = boxMaterial;
    }

    debugCameraCallback() {
        const camera = this.scene.activeCamera as ArcRotateCamera;
        const target = camera.target;
        if (this.debugBox) {
            this.debugBox.position = target;
        } else {
            this.initDebugBox();
        }
    }

    /**
     * 调试相机, 在相机目标位置创建一个调试盒
     */
    debugCamera(debug = true) {
        if (debug) {
            this.debugCameraObserver = this.scene.onAfterCameraRenderObservable.add(this.debugCameraCallback.bind(this))
        } else {
            this.scene.onAfterCameraRenderObservable.remove(this.debugCameraObserver)
            if (this.debugBox) {
                this.scene.removeMesh(this.debugBox);
                this.debugBox.dispose();
            }
        }
    }


    /**
     * 聚焦到指定的网格, 相机半径也会修改
     * @param meshes 网格
     * @param doNotUpdateMaxZ
     */
    zoomOn(meshes: AbstractMesh[], doNotUpdateMaxZ = true) {
        let camera = this.scene.activeCamera;
        if (isArcRotateCamera(camera)) {
            camera.zoomOn(meshes, doNotUpdateMaxZ);
        }
    }

    /**
     * 聚焦到指定的网格, 相机半径不会变
     * @param meshes 网格
     * @param doNotUpdateMaxZ
     */
    focusOn(meshes: AbstractMesh[], doNotUpdateMaxZ = true) {
        let camera = this.scene.activeCamera;
        if (isArcRotateCamera(camera)) {
            camera.focusOn(meshes, doNotUpdateMaxZ);
        }
    }


    // 聚焦到场景
    focusToScene() {
        const camera = this.scene.activeCamera! as unknown as ArcRotateCamera;

        camera.useFramingBehavior = true;

        const framingBehavior = camera.framingBehavior!
        // 设置动画时间
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;
        // 不自动调整相机范围和敏感度
        framingBehavior.autoCorrectCameraLimitsAndSensibility = false;
        // camera.lowerRadiusLimit = null;

        const worldExtends = this.scene.getAllSceneExtends();
        framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
    }
}
