import { Camera, CameraGizmo, GizmoManager, Light, LightGizmo, Scene, UtilityLayerRenderer } from "@babylonjs/core";
import { GizmoEnum } from "../enum";

export class PlumGizmoManager extends GizmoManager {
    // 存储光源与其对应的Gizmo
    lightGizmosMap = new Map<Light, LightGizmo>();
    // 存储相机与其对应的Gizmo
    cameraGizmosMap = new Map<Camera, CameraGizmo>();

    constructor(_scene: Scene, thickness?: number, utilityLayer?: UtilityLayerRenderer, keepDepthUtilityLayer?: UtilityLayerRenderer) {
        super(_scene, thickness, utilityLayer, keepDepthUtilityLayer);
    }

    // 启用光源Gizmo
    enableLightGizmo(light: Light) {
        if (this.lightGizmosMap.has(light)) {
            return this.lightGizmosMap.get(light)!;
        }
        let lightGizmo = new LightGizmo();
        lightGizmo.light = light;
        this.lightGizmosMap.set(light, lightGizmo);
        lightGizmo.updateGizmoPositionToMatchAttachedMesh = true; // 更新Gizmo位置以匹配附加的网格
        return lightGizmo;
    }

    // 启用相机Gizmo
    enableCameraGizmo(camera: Camera) {
        if (this.cameraGizmosMap.has(camera)) {
            return this.cameraGizmosMap.get(camera)!;
        }
        let cameraGizmo = new CameraGizmo();
        cameraGizmo.camera = camera;
        this.cameraGizmosMap.set(camera, cameraGizmo);
        return cameraGizmo;
    }

    // 移除光源Gizmo
    removeLightGizmo(light: Light) {
        this.lightGizmosMap.delete(light);
    }

    // 移除相机Gizmo
    removeCameraGizmo(camera: Camera) {
        this.cameraGizmosMap.delete(camera);
    }

    // 设置Gizmo类型
    setGizmoType(value: GizmoEnum) {
        switch (value) {
            case GizmoEnum.Position:
                this.positionGizmoEnabled = true; // 启用位置Gizmo
                this.rotationGizmoEnabled = false;
                this.scaleGizmoEnabled = false;
                this.boundingBoxGizmoEnabled = false;
                break;
            case GizmoEnum.Rotation:
                this.positionGizmoEnabled = false;
                this.rotationGizmoEnabled = true; // 启用旋转Gizmo
                this.scaleGizmoEnabled = false;
                this.boundingBoxGizmoEnabled = false;
                break;
            case GizmoEnum.Scale:
                this.positionGizmoEnabled = false;
                this.rotationGizmoEnabled = false;
                this.scaleGizmoEnabled = true; // 启用缩放Gizmo
                this.boundingBoxGizmoEnabled = false;
                break;
            case GizmoEnum.BoundingBox:
                this.positionGizmoEnabled = false;
                this.rotationGizmoEnabled = false;
                this.scaleGizmoEnabled = false;
                this.boundingBoxGizmoEnabled = true; // 启用边界框Gizmo
                break;
        }
    }
}