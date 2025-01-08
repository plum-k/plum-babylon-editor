import {Command, ICommand} from "./Command";
import {get, PropertyPath, set} from "lodash-es";

export interface ISetValueCommand<T = any, E = any> extends ICommand {
    object: T,
    newValue: E,
    oldValue?: E
    attributePath: PropertyPath,
}

export class SetValueCommand<T = object, E = any> extends Command {
    type = 'SetValueCommand';
    // 旧的值
    oldValue!: E;
    // 新的值
    newValue!: E;

    constructor(option: ISetValueCommand<T, E>) {
        super(option);
        const {object, attributePath, newValue, oldValue} = option;
        this.attributePath = attributePath;
        this.name = 'command/SetValue' + ': ' + this.getAttributeName();
        this.object = object;
        this.newValue = newValue;
        if (oldValue) {
            this.oldValue = oldValue;
        } else {
            this.oldValue = object ? get(object, attributePath) : null;
        }
    }

    execute() {
        set(this.object, this.attributePath, this.newValue);
    }

    undo() {
        set(this.object, this.attributePath, this.oldValue);
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