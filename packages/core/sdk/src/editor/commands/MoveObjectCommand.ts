import {Command} from "./Command";
import {isNumber} from "lodash-es";

/**
 * @param editor Editor
 * @param object AbstractMesh
 * @param newParent AbstractMesh
 * @param newBefore AbstractMesh
 * @constructor
 */
export class MoveObjectCommand extends Command {
    type: string = 'MoveObjectCommand';
    oldParent: AbstractMesh | null;
    oldIndex: number | null;
    newParent: AbstractMesh | null;
    newIndex: number | null;
    newBefore: number

    constructor(
        object: AbstractMesh,
        newParent: AbstractMesh,
        newBefore: string
    ) {
        super();

        this.name = 'command/MoveObject';

        this.object = object;
        this.oldParent = object ? object.parent : null;
        this.oldIndex = this.oldParent ? this.oldParent.children.indexOf(this.object!) : null;
        this.newParent = newParent;

        if (newBefore !== null) {
            this.newIndex = this.newParent ? this.newParent.children.indexOf(newBefore) : null;
        } else {
            this.newIndex = this.newParent ? this.newParent.children.length : null;
        }

        if (this.oldParent === this.newParent && this.newIndex! > this.oldIndex!) {
            if (isNumber(this.newIndex)) {
                this.newIndex--;
            }
        }

        this.newBefore = newBefore;
    }

    execute(): void {
        this.oldParent!.remove(this.object!);

        const children = this.newParent!.children;
        children.splice(this.newIndex!, 0, this.object!);
        this.object!.parent = this.newParent;
        console.log("更新111")
        // this.editor.signals.sceneGraphChanged.dispatch();
        this.editor.eventManager.sceneGraphChanged.next(null);
    }

    undo(): void {
        this.newParent!.remove(this.object!);

        const children = this.oldParent!.children;
        children.splice(this.oldIndex!, 0, this.object!);
        this.object!.parent = this.oldParent;

        this.editor.eventManager.sceneGraphChanged.next(null);
        // this.editor.signals.sceneGraphChanged.dispatch();
    }

    toJSON(): any {
        const output = super.toJSON();

        output.objectUuid = this.object!.uuid;
        output.newParentUuid = this.newParent!.uuid;
        output.oldParentUuid = this.oldParent!.uuid;
        output.newIndex = this.newIndex;
        output.oldIndex = this.oldIndex;

        return output;
    }

    fromJSON(json: any): void {
        // super.fromJSON(json);
        //
        // this.object = this.editor.objectByUuid(json.objectUuid)!;
        // this.oldParent = this.editor.objectByUuid(json.oldParentUuid);
        // if (this.oldParent === undefined) {
        //     this.oldParent = this.editor.scene;
        // }
        //
        // this.newParent = this.editor.objectByUuid(json.newParentUuid);
        // if (this.newParent === undefined) {
        //     this.newParent = this.editor.scene;
        // }
        //
        // this.newIndex = json.newIndex;
        // this.oldIndex = json.oldIndex;
    }

    update(command: this): void {
    }
}