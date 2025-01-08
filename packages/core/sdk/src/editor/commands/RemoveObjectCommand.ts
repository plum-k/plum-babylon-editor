import {Command, CommandJson, ICommand} from "./Command";
import {Nullable} from "@babylonjs/core";

export interface IRemoveObjectCommand extends ICommand {
    object: object,
}

export class RemoveObjectCommand extends Command {
    parent: Nullable<object> = null;

    constructor(option: IRemoveObjectCommand) {
        super(option);

        this.type = 'RemoveObjectCommand';

        this.object = option.object;
        this.parent = this.object?.parent || null;

        if (this.object !== null) {
            this.name = 'command/RemoveObject' + ': ' + this.object.uniqueId;
        }
    }

    execute() {
        this.editor.removeObject(this.object, this.parent);
        this.editor.select.deselect();
    }

    undo() {
        this.editor.addObject(this.object, this.parent);
        this.editor.select.select(this.object!);
    }

    toJSON() {
        const output = super.toJSON();

        // output.object = this.object?.toJSON();
        // output.index = this.index;
        // output.parentUuid = this.parent?.uuid;

        return output;
    }

    fromJSON(json: CommandJson) {
        super.fromJSON(json);
    }

    update(command: this): void {
    }
}