import {Tool} from "../../..";
import {ISetValueCommand, SetValueCommand} from "../SetValueCommand";
import {Color3, Vector3} from "@babylonjs/core";

export interface ISetColorCommand extends ISetValueCommand<Color3> {
}

export class SetColorCommand extends SetValueCommand<Vector3> {
    type: string = 'SetColorCommand';
    attributeName: string;

    constructor(options: ISetColorCommand) {
        super();
        this.updatable = true;
        this.name = 'command/SetColor' + ': ' + attributeName;
        this.object = object;
        this.attributeName = attributeName;
        this.oldValue = object !== null ? Tool.reflectGet(this.object, this.attributeName).getHex() : null;
        this.newValue = newValue;
    }

    execute() {
        if (this.object) {
            Tool.reflectGet(this.object, this.attributeName).setHex(this.newValue!);
            // this.editor.signals.objectChanged.dispatch(this.object!);
        }
    }

    undo() {
        if (this.object) {
            Tool.reflectGet(this.object, this.attributeName).setHex(this.oldValue!);
            // this.editor.signals.objectChanged.dispatch(this.object!);
        }
    }

    update(cmd: SetColorCommand) {
        this.newValue = cmd.newValue;
    }

    toJSON() {
        const output = super.toJSON();
        output.objectUuid = this.object?.uuid;
        output.attributeName = this.attributeName;
        output.oldValue = this.oldValue;
        output.newValue = this.newValue;
        return output;
    }

    fromJSON(json: any) {
        super.fromJSON(json);
        this.object = this.editor.objectByUuid(json.objectUuid)!;
        this.attributeName = json.attributeName;
        this.oldValue = json.oldValue;
        this.newValue = json.newValue;
    }
}