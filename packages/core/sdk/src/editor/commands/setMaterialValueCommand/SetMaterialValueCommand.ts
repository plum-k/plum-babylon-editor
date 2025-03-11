import {ISetValueCommand, SetValueCommand} from "../SetValueCommand";
import {Material} from "@babylonjs/core";

export interface ISetMaterialValueCommand<T = any> extends ISetValueCommand<Material, T> {
}


export class SetMaterialValueCommand<T = any> extends SetValueCommand<Material, T> {
    executeNum = 0

    constructor(option: ISetMaterialValueCommand) {
        super(option);
    }

    execute() {
        super.execute();
        this.notice()
    }

    undo() {
        super.undo();
        this.notice()
    }

    /**
     * 通知属性变化
     */
    notice() {
        // 第一是从表单触发的更新, 不通知更改
        if (this.source === "Form" && this.executeNum === 0) {

        } else {
            this.editor.editorEventManager.selectMaterialChanged.next({
                source: this.source,
                object: this.object,
                attributePath: this.attributePath
            })
        }
        this.executeNum++;
    }


    toJSON() {
        const output = super.toJSON();

        // output.objectUuid = this.object!.uuid;
        // output.attributeName = this.attributeName;
        // output.oldValue = this.oldValue;
        // output.newValue = this.newValue;

        return output;
    }

    fromJSON(json: any) {
        // super.fromJSON(json);
        // this.attributeName = json.attributeName;
        // this.oldValue = json.oldValue;
        // this.newValue = json.newValue;
        // this.object = this.editor.objectByUuid(json.objectUuid)!!;
    }
}