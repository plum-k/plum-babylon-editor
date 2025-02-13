import {BehaviorSubject, Subject} from 'rxjs';
import {BasePlum, IBasePlumOptions} from "../core/BasePlum";
import {Node, Nullable, PBRMaterial} from "@babylonjs/core";
import {PropertyPath} from "lodash-es";
import {PlumMeshAssetTask} from "../manager";


export interface IEditorEventManagerOptions extends IBasePlumOptions {
}

export interface ISelectObjectChanged {
    source: string;
    object: Node;
    attributePath: PropertyPath
}

export interface ISelectMaterialChanged {
    source: string;
    object: PBRMaterial;
    attributePath: PropertyPath
}

export class EditorEventManager extends BasePlum {

    // 场景变化事件
    sceneGraphChanged = new BehaviorSubject(false);

    // 在三维中选择物体
    objectSelected = new Subject<Nullable<Node>>();

    // 被控制的三维对象位置等信息被修改
    selectObjectChanged = new Subject<ISelectObjectChanged>();

    // 选择的材质变化
    selectMaterialChanged = new Subject<ISelectMaterialChanged>();

    constructor(options: IEditorEventManagerOptions) {
        super(options);
        this.mergeSubject();

        // 模型加载成功后 派发场景变化事件
        this.viewer.assetsManager.onTaskSuccessObservable.add((task) => {
            if (this.viewer.isLoad) {
                if (task instanceof PlumMeshAssetTask) {
                    this.sceneGraphChanged.next(true);
                }
            }
        });


        // 加载模型事件
        // this.viewer.scene.onDataLoadedObservable.add((e) => {
        //     if (this.viewer.isLoad) {
        //         this.sceneGraphChanged.next(true);
        //     }
        // });

        // 场景加载完成后, 派发事件
        // this.viewer.initSubject.subscribe(()=>{
        //     this.sceneGraphChanged.next(true);
        // })
    }

    mergeSubject() {
        // 合并事件并派发
        // merge(this.objectAdded, this.objectRemoved)
        //     // merge(this.objectAdded, this.objectChanged, this.objectRemoved)
        //     // merge(this.objectAdded)
        //     .subscribe(value => {
        //         console.log("添加")
        //         this.sceneGraphChanged.next(value)
        //     });
    }
}
