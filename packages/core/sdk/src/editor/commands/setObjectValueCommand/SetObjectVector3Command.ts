import {get} from "lodash-es";
import {Vector3} from "@babylonjs/core";
import {ISetValueCommand, SetValueCommand} from "../SetValueCommand";
import {SetObjectValueCommand} from "./SetObjectValueCommand";

export interface ISetObjectVector3Command extends ISetValueCommand<any, Vector3> {
}

export class SetObjectVector3Command extends SetObjectValueCommand {
    constructor(option: ISetObjectVector3Command) {
        super(option);
        this.newValue = this.newValue.clone();
        if (this.oldValue) {
            this.oldValue = this.oldValue.clone();
        }
    }

    execute() {
        let attribute = get(this.object, this.attributePath);
        if (attribute) {
            attribute.x = this.newValue.x;
            attribute.y = this.newValue.y;
            attribute.z = this.newValue.z;
            // attribute.copyFrom(this.newValue)
        }
        this.notice()
    }

    undo() {
        let attribute = get(this.object, this.attributePath);
        if (attribute) {
            attribute.x = this.oldValue.x;
            attribute.y = this.oldValue.y;
            attribute.z = this.oldValue.z;
            // attribute.copyFrom(this.oldValue)
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