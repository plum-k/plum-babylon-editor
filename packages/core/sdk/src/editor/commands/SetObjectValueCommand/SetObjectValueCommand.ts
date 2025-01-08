import {ISetValueCommand, SetValueCommand} from "../SetValueCommand";

export interface ISetObjectValueCommand<T = any> extends ISetValueCommand<T> {

}

/**
 * 选择对象的值变化设置
 */
export class SetObjectValueCommand extends SetValueCommand {
    executeNum = 0

    constructor(option: ISetObjectValueCommand) {
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
            this.editor.editorEventManager.selectObjectChanged.next({
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