import {get, set} from "lodash-es";
import {Quaternion} from "@babylonjs/core";
import {ISetValueCommand, SetValueCommand} from "../SetValueCommand";
import {SetObjectValueCommand} from "./SetObjectValueCommand";

export interface ISetObjectQuaternionCommand extends ISetValueCommand<any, Quaternion> {
}

export class SetObjectQuaternionCommand extends SetObjectValueCommand {
    constructor(option: ISetObjectQuaternionCommand) {
        super(option);
        this.newValue = this.newValue.clone();
        if (this.oldValue) {
            this.oldValue = this.oldValue.clone();
        }
    }

    execute() {
        let attribute = get(this.object, this.attributePath) as Quaternion;
        if (attribute) {
            attribute.copyFrom(this.newValue);
        }else {
            // rotationQuaternion 没有使用时,默认为空,直接赋值
            set(this.object, this.attributePath, this.newValue);
        }
        this.notice()
    }

    undo() {
        let attribute = get(this.object, this.attributePath) as Quaternion;
        if (attribute) {
            attribute.copyFrom(this.oldValue);
        }
        this.notice()
    }

    update(cmd: SetValueCommand) {
        this.newValue = cmd.newValue;
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