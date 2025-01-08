import {Camera, CameraGizmo, GizmoManager, Light, LightGizmo, Scene, UtilityLayerRenderer} from "@babylonjs/core";
import {GizmoEnum} from "../enum";


export class PlumGizmoManager extends GizmoManager {
    lightGizmosMap = new Map<Light, LightGizmo>();
    cameraGizmosMap = new Map<Camera, CameraGizmo>();

    constructor(_scene: Scene, thickness?: number, utilityLayer?: UtilityLayerRenderer, keepDepthUtilityLayer?: UtilityLayerRenderer) {
        super(_scene, thickness, utilityLayer, keepDepthUtilityLayer);
    }

    enableLightGizmo(light: Light) {
        if (this.lightGizmosMap.has(light)) {
            return this.lightGizmosMap.get(light)!;
        }
        let lightGizmo = new LightGizmo();
        lightGizmo.light = light;
        this.lightGizmosMap.set(light, lightGizmo);
        lightGizmo.updateGizmoPositionToMatchAttachedMesh = true;
        return lightGizmo;
    }

    enableCameraGizmo(camera: Camera) {
        if (this.cameraGizmosMap.has(camera)) {
            return this.cameraGizmosMap.get(camera)!;
        }
        let cameraGizmo = new CameraGizmo();
        cameraGizmo.camera = camera;
        this.cameraGizmosMap.set(camera, cameraGizmo);
        return cameraGizmo;
    }

    removeLightGizmo(light: Light) {
        this.lightGizmosMap.delete(light);
    }

    removeCameraGizmo(camera: Camera) {
        this.cameraGizmosMap.delete(camera);
    }


    setGizmoType(value: GizmoEnum) {
        switch (value) {
            case GizmoEnum.Position:
                this.positionGizmoEnabled = true;
                this.rotationGizmoEnabled = false;
                this.scaleGizmoEnabled = false;
                this.boundingBoxGizmoEnabled = false;
                break;
            case GizmoEnum.Rotation:
                this.positionGizmoEnabled = false;
                this.rotationGizmoEnabled = true;
                this.scaleGizmoEnabled = false;
                this.boundingBoxGizmoEnabled = false;
                break;
            case GizmoEnum.Scale:
                this.positionGizmoEnabled = false;
                this.rotationGizmoEnabled = false;
                this.scaleGizmoEnabled = true;
                this.boundingBoxGizmoEnabled = false;
                break;
            case GizmoEnum.BoundingBox:
                this.positionGizmoEnabled = false;
                this.rotationGizmoEnabled = false;
                this.scaleGizmoEnabled = false;
                this.boundingBoxGizmoEnabled = true;
                break;
        }
    }
}