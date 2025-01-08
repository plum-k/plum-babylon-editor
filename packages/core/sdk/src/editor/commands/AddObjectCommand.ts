import {Command, ICommand} from "./Command";

export interface IAddObjectCommand extends ICommand {
    object: object,
}

export class AddObjectCommand extends Command {
    constructor(option: IAddObjectCommand) {
        super(option);
        this.object = option.object;

        if (this.object !== null) {
            this.name = 'command/AddObject' + ': ' + this.object.name;
        }
    }

    execute(): void {
        const isHas = this.editor.viewer.scene.objectIsInScene(this.object);
        if (isHas) {
            this.editor.editorEventManager.sceneGraphChanged.next(true);
        } else {
            this.editor.addObject(this.object);
        }
        this.editor.select.select(this.object);
    }

    undo(): void {
        this.editor.removeObject(this.object);
        this.editor.select.deselect();
    }

    update(command: this): void {
    }

    toJSON(): any {
        const output = super.toJSON();
        // output.object = this.object?.toJSON();
        return output;
    }

    fromJSON(json: any): void {
        super.fromJSON(json);
        // this.object = this.editor.objectByUuid(json.object.object.uuid)!;
        //
        // if (this.object === undefined) {
        //     const loader = new ObjectLoader();
        //     this.object = loader.parse(json.object);
        // }
    }
}