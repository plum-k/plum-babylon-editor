import {get, isNil} from "lodash-es";
import {BoundingInfo, Node, Nullable, PhysicsPrestepType, Quaternion, Vector3} from "@babylonjs/core";
import {isCamera, isLight, isMesh} from "../guard";
import {Editor} from "./index";
import {GizmoEnum} from "../enum";

export class Select {
    selectNode: Nullable<Node> = null
    oldPosition: Vector3 = new Vector3()
    oldRotation: Vector3 = new Vector3();
    oldQuaternion: Quaternion = new Quaternion();
    oldScale: Vector3 = new Vector3();
    editor: Editor;

    constructor(editor: Editor) {

        this.editor = editor;

        // 启用全部后可以监听
        this.init();
        this.gizmoManager.setGizmoType(GizmoEnum.Position)
        this.bindDragObservable()

        // 场景中选择对象变化
        this.editor.viewer.eventManager.pointerLeftTapSubject.subscribe((value) => {
            const {pickInfo} = value;
            if (isNil(pickInfo)) {
            } else {
                const {pickedMesh} = pickInfo;
                this.select(pickedMesh as unknown as Nullable<Node>)
            }
        })
    }

    get gizmoManager() {
        return this.editor.gizmoManager;
    }

    bindDragObservable() {
        this.bindPositionGizmo();
        this.bindRotationGizmo();
        this.bindScaleGizmo();
    }

    bindPositionGizmo() {
        this.gizmoManager.gizmos?.positionGizmo?.onDragStartObservable.add(() => {
            if (this.selectNode) {
                if ("position" in this.selectNode) {
                    this.oldPosition.copyFrom(this.selectNode?.position as Vector3)
                }
                // 开启物理后, 在拖动时, 不允许同步
                if (isMesh(this.selectNode) && this.selectNode.physicsBody) {
                    this.selectNode.physicsBody.disableSync = true
                }
            }
        })
        this.gizmoManager.gizmos?.positionGizmo?.onDragObservable.add(() => {
            if (this.selectNode) {
                this.editor.editorEventManager.selectObjectChanged.next({
                    attributePath: ['position'],
                    source: "Gizmo",
                    object: this.selectNode
                })
            }
        })
        this.gizmoManager.gizmos?.positionGizmo?.onDragEndObservable.add(() => {
            if (this.selectNode && "position" in this.selectNode && (this.selectNode.position as Vector3).subtract(this.oldPosition).lengthSquared() > 0) {
                this.editor.setPositionExecute({
                    source: "Gizmo",
                    object: this.selectNode,
                    attributePath: ['position'],
                    newValue: this.selectNode.position as Vector3,
                    oldValue: this.oldPosition
                })
            }
            // 开启物理后, 在拖动结束时,  允许同步
            if (isMesh(this.selectNode) && this.selectNode.physicsBody) {
                this.selectNode.physicsBody.disableSync = false
                // 拖动后, 同步物理位置
                this.selectNode.physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
            }
        })
    }

    bindRotationGizmo() {
        this.gizmoManager.gizmos?.rotationGizmo?.onDragStartObservable.add(() => {
            if (this.selectNode) {
                const rotationQuaternion = get(this.selectNode, "rotationQuaternion") as unknown as Quaternion | null;
                if (!isNil(rotationQuaternion)) {
                    this.oldQuaternion.copyFrom(rotationQuaternion)
                } else {
                    if ("rotation" in this.selectNode) {
                        this.oldRotation.copyFrom(this.selectNode.rotation as Vector3)
                    } else if ("direction" in this.selectNode) {
                        this.oldRotation.copyFrom(this.selectNode.direction as Vector3)
                    }
                }
            }
        })
        this.gizmoManager.gizmos?.rotationGizmo?.onDragObservable.add(() => {
            if (this.selectNode) {
                const rotationQuaternion = get(this.selectNode, "rotationQuaternion") as unknown as Quaternion | null;
                if (!isNil(rotationQuaternion)) {
                    this.editor.editorEventManager.selectObjectChanged.next({
                        attributePath: ['rotationQuaternion'],
                        source: "Gizmo",
                        object: this.selectNode
                    })
                } else {
                    if ("rotation" in this.selectNode) {
                        this.editor.editorEventManager.selectObjectChanged.next({
                            attributePath: ['rotation'],
                            source: "Gizmo",
                            object: this.selectNode
                        })
                    } else if ("direction" in this.selectNode) {
                        this.editor.editorEventManager.selectObjectChanged.next({
                            attributePath: ['direction'],
                            source: "Gizmo",
                            object: this.selectNode
                        })
                    }
                }
            }
        })
        this.gizmoManager.gizmos?.rotationGizmo?.onDragEndObservable.add(() => {
            console.log("this.selectNode", this.selectNode)

            // console.log("this.oldQuaternion", this.oldQuaternion)
            // console.log('this.selectNode.rotationQuaternion', this.selectNode.rotationQuaternion)
            if (this.selectNode) {
                const rotationQuaternion = get(this.selectNode, "rotationQuaternion") as unknown as Quaternion | null;
                if (!isNil(rotationQuaternion)) {
                    if (rotationQuaternion!.equals(this.oldQuaternion)) {
                        this?.editor.setObjectQuaternionCommand({
                            source: "Form",
                            object: this.selectNode,
                            attributePath: ['rotationQuaternion'],
                            newValue: rotationQuaternion,
                            oldValue: this.oldQuaternion
                        })
                    }
                } else {
                    if ("rotation" in this.selectNode) {
                        this.editor.setRotationExecute({
                            source: "Gizmo",
                            object: this.selectNode,
                            attributePath: ['rotation'],
                            newValue: this.selectNode.rotation as Vector3,
                            oldValue: this.oldRotation
                        })
                    } else if ("direction" in this.selectNode) {
                        this.editor.setRotationExecute({
                            source: "Gizmo",
                            object: this.selectNode,
                            attributePath: ['direction'],
                            newValue: this.selectNode.direction as Vector3,
                            oldValue: this.oldRotation
                        })
                    }
                }
            }
        })
    }

    bindScaleGizmo() {
        this.gizmoManager.gizmos?.scaleGizmo?.onDragStartObservable.add(() => {
            if (this.selectNode) {
                if ("scaling" in this.selectNode) {
                    this.oldPosition.copyFrom(this.selectNode?.scaling as Vector3)
                }
            }
        })
        this.gizmoManager.gizmos?.scaleGizmo?.onDragObservable.add(() => {
            if (this.selectNode) {
                this.editor.editorEventManager.selectObjectChanged.next({
                    attributePath: ['scaling'],
                    source: "Gizmo",
                    object: this.selectNode
                })
            }
        })
        this.gizmoManager.gizmos?.scaleGizmo?.onDragEndObservable.add(() => {
            if (this.selectNode && "scaling" in this.selectNode && (this.selectNode.scaling as Vector3).equals(this.oldScale)) {
                this.editor.setPositionExecute({
                    source: "Gizmo",
                    object: this.selectNode,
                    attributePath: ['scaling'],
                    newValue: this.selectNode.scaling as Vector3,
                    oldValue: this.oldScale
                })
            }
        })
    }

    init() {
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.rotationGizmoEnabled = true;
        this.gizmoManager.scaleGizmoEnabled = true;
        // this.gizmoManager.boundingBoxGizmoEnabled = true;
    }

    updateSelect(value: Nullable<Node>) {
        // 新选取的对象和之前选中的对象相同, 直接返回
        if (this.selectNode === value) {
            return
        }

        // 移除上次选中的物体
        if (this.selectNode) {
            if (isMesh(this.selectNode)) {
                this.selectNode.showBoundingBox = false;
            }
            this.gizmoManager.attachToNode(null);
        }

        if (isNil(value)) {

        } else {
            // todo 变换节点
            if (isMesh(value)) {
                if (isNil(value.subMeshes)) {
                    let {min, max} = value.getHierarchyBoundingVectors();
                    value.setBoundingInfo(new BoundingInfo(min, max));
                } else {

                }
                value.showBoundingBox = true;
                this.gizmoManager.attachToMesh(value);
            } else if (isLight(value)) {
                const lightGizmo = this.gizmoManager.enableLightGizmo(value);
                this.gizmoManager.attachToNode(lightGizmo.attachedNode);
            } else if (isCamera(value)) {
                const activeCamera = this.editor.scene.activeCamera!;
                if (activeCamera === value) {
                } else {
                    const cameraGizmo = this.gizmoManager.enableCameraGizmo(value);
                    this.gizmoManager.attachToNode(cameraGizmo.attachedNode);
                }
            }
        }

        // todo 初始化时  gizmoManager 的 网格会被删除 ???
        this.selectNode = value;
        this.editor.editorEventManager.objectSelected.next(value)
    }

    select(value: Nullable<Node>) {
        this.updateSelect(value);
    }

    deselect() {
        this.updateSelect(null);
    }
}