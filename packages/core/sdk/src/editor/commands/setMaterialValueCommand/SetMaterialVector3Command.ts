import {get} from "lodash-es";
import {Vector3} from "@babylonjs/core";
import {SetValueCommand} from "../SetValueCommand";
import {ISetMaterialValueCommand, SetMaterialValueCommand} from "./SetMaterialValueCommand";

export interface ISetMaterialVector3Command extends ISetMaterialValueCommand<Vector3> {
}

export class SetMaterialVector3Command extends SetMaterialValueCommand {
    constructor(option: ISetMaterialVector3Command) {
        super(option);
        this.newValue = this.newValue.clone();
        if (this.oldValue) {
            this.oldValue = this.oldValue.clone();
        }
    }

    execute() {
        const attribute = get(this.object, this.attributePath);
        if (attribute) {
            attribute.copyFrom(this.newValue)
        }
        this.notice()
    }

    undo() {
        const attribute = get(this.object, this.attributePath);
        if (attribute) {
            attribute.copyFrom(this.oldValue)
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