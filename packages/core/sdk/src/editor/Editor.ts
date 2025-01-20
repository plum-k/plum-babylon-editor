import {BasePlum, IBasePlumOptions} from "../core/BasePlum";
import {FilesInput, Node, Nullable,UtilityLayerRenderer} from "@babylonjs/core";
import {History} from "./History"
import {
    AddObjectCommand,
    Command,
    IAddObjectCommand,
    IRemoveObjectCommand,
    ISetMaterialColor3Command,
    ISetMaterialValueCommand,
    RemoveObjectCommand,
    SetMaterialColor3Command,
    SetMaterialValueCommand,
} from "./commands";
import {uniqueId} from "lodash-es";
import {PlumGizmoManager} from "../manager";
import {isMesh} from "../guard";
import {ISetObjectVector3Command} from "./commands/SetObjectValueCommand/SetObjectVector3Command";
import {ISetObjectValueCommand, SetObjectValueCommand} from "./commands/SetObjectValueCommand/SetObjectValueCommand";
import {SetPositionCommand} from "./commands/SetObjectValueCommand/SetPositionCommand";
import {SetRotationCommand} from "./commands/SetObjectValueCommand/SetRotationCommand";
import {SetScaleCommand} from "./commands/SetObjectValueCommand/SetScaleCommand";
import {ISetValueCommand, SetValueCommand} from "./commands/SetValueCommand";
import {ISetMaterialMapCommand, SetMaterialMapCommand} from "./commands/SetMaterialValueCommand/SetMaterialMapCommand";
import {
    ISetObjectQuaternionCommand,
    SetObjectQuaternionCommand
} from "./commands/SetObjectValueCommand/SetObjectQuaternionCommand";
import {GridTool} from "../tool/GridTool";
import {Select} from "./Select";
import { EditorEventManager } from "./EditorEventManager";
import {loadFiles, loadItemList} from "../tool";

export interface IEditorOptions extends IBasePlumOptions {
}

export class Editor extends BasePlum {
    history: History;
    geometries = new Map<string, any>();
    //-------------------选择
    select: Select
    //-------------------------------------- 文件拖动导入
    // filesInput!: FilesInput;
    editorEventManager: EditorEventManager;
    gizmoManager: PlumGizmoManager;
    gridTool: GridTool;

    constructor(options: IEditorOptions) {
        super(options);

        this.history = new History(this);
        const scene = this.viewer.scene;
        this.gizmoManager = new PlumGizmoManager(scene,undefined, new UtilityLayerRenderer(scene), new UtilityLayerRenderer(scene));
        this.gizmoManager.usePointerToAttachGizmos = false;

        this.addLightEvent();
        this.editorEventManager = new EditorEventManager({
            viewer: this.viewer
        })
        this.select = new Select(this);

        this.gridTool = new GridTool();
        this.gridTool.addOrRemoveGrid(null, 500, 500)

        // 监听拖动文件到画布
        this.addDragEvent()

        // 启用编辑模式后, 通知场景图发生变化, 因为其他模型,可能加载了 灯光或 相机
        this.editorEventManager.sceneGraphChanged.next(true);
    }

    addDragEvent() {
        this.eventManager.dropSubject.subscribe((event) => {
            const items = event.dataTransfer!.items
            const files = event.dataTransfer!.files;
            if (items) {
                loadItemList(items, this.loadFile.bind(this))
            } else {
                loadFiles(files as unknown as Array<File>, this.loadFile.bind(this))
            }
        })
    }

    loadFile(file: File, manager?: any) {
        const filename = file.name;
        const splitArray = filename.split('.')
        if (splitArray.length === 2) {
            let [name, extension] = splitArray;
            let assetsManager = this.viewer.assetsManager;
            switch (extension.toLowerCase()) {
                case "babylon":
                case "obj":
                case "gltf":
                case 'glb': {
                    let meshAssetTask = assetsManager.addPlumMeshTask(`${uniqueId(name)}`, "", "file:", file);
                    meshAssetTask.onSuccess = (task) => {

                    }
                    assetsManager.load();
                    break;
                }
                case "dds":
                case "env":
                case "hdr": {
                    FilesInput.FilesToLoad[file.name] = file;
                    let meshAssetTask = assetsManager.addHDRCubeTextureTask(`${uniqueId(name)}`, `file:${file.name}`, 256, false, true, false, true);
                    meshAssetTask.onSuccess = (task) => {
                        this.scene.environmentTexture = task.texture;
                    }
                    assetsManager.load();
                    break;
                }
            }
        }
    }

    // 灯光和相机添加时 创建对应的gizmo
    addLightEvent() {
        this.viewer.scene.onNewLightAddedObservable.add((light) => {
            this.gizmoManager.enableLightGizmo(light);
        })
        this.viewer.scene.onLightRemovedObservable.add((light) => {
            this.gizmoManager.removeLightGizmo(light);
        })
        // todo 会导致 div 抖动
        this.viewer.scene.onNewCameraAddedObservable.add((camera) => {
            // this.gizmoManager.enableCameraGizmo(camera);
        })
        this.viewer.scene.onCameraRemovedObservable.add((camera) => {
            this.gizmoManager.removeCameraGizmo(camera);
        })
    }

    //------------------------- 选择 结束 -----------------------

    //------------------ 操作历史 开始-----------------
    execute(cmd: Command<any>, optionalName?: string) {
        this.history.execute(cmd, optionalName);
        // console.log(this.history)
    }

    undo() {
        this.history.undo();
    }

    redo() {
        this.history.redo();
    }

    addObjectCommandExecute(option: IAddObjectCommand) {
        this.execute(new AddObjectCommand(option));
    }

    removeObjectExecute(option: IRemoveObjectCommand) {
        this.execute(new RemoveObjectCommand(option))
    }


    moveObjectExecute(objectUUid: string,
                      newParentUUid: string,
                      newBefore: number) {
    }

    setPositionExecute(option: ISetObjectVector3Command) {
        this.execute(new SetPositionCommand(option))
    }

    setRotationExecute(option: ISetObjectVector3Command) {
        this.execute(new SetRotationCommand(option))
    }


    setObjectQuaternionCommand(option: ISetObjectQuaternionCommand) {
        this.execute(new SetObjectQuaternionCommand(option))
    }


    setScaleExecute(option: ISetObjectVector3Command) {
        this.execute(new SetScaleCommand(option))
    }

    setObjectValueExecute(option: ISetObjectValueCommand) {
        this.execute(new SetObjectValueCommand(option))
    }

    setValueExecute(option: ISetValueCommand) {
        this.execute(new SetValueCommand(option))
    }

    setMaterialValueExecute(option: ISetMaterialValueCommand) {
        this.execute(new SetMaterialValueCommand(option))
    }

    setMaterialMapExecute(option: ISetMaterialMapCommand) {
        this.execute(new SetMaterialMapCommand(option))
    }

    setMaterialColor3Execute(option: ISetMaterialColor3Command) {
        this.execute(new SetMaterialColor3Command(option))
    }

    //------------------ 操作历史 结束-----------------

    //------------------ 操作历史对应的方法 开始-----------------
    addObject(node: Node, parent: Nullable<Node> = null) {
        if (isMesh(parent) && isMesh(node)) {
            parent.addChild(node);
        } else {
            this.viewer.addNode(node, true);
        }
        this.editorEventManager.sceneGraphChanged.next(true);
    }

    removeObject(node: Node, parent: Nullable<Node> = null) {
        if (isMesh(parent) && isMesh(node)) {
            parent.removeChild(node);
        } else {
            this.viewer.removeNode(node, true);
        }
        // this.editor.eventManager.removeObjectSubject.next(null);
        this.editorEventManager.sceneGraphChanged.next(true);
    }

    //------------------ 操作历史对应的方法 结束-----------------
}