import {Editor} from "../Editor";
import {PropertyPath, toPath} from "lodash-es";

export interface CommandJson {
    id: number;
    type: string;
    name: string;

    [key: string]: any;
}

export interface ICommand {
    source?: string | "Form";
}

export abstract class Command<T = any> {
    id: number = 0;
    inMemory: boolean = false;
    updatable: boolean = false;
    type: string = '';
    name: string = '';
    editor!: Editor;
    attributePath: PropertyPath = []

    // 操作的对象
    object!: T;

    source: string;

    protected constructor(option: ICommand) {
        this.type = this.constructor.name;
        this.source = option.source ?? "";
    }

    abstract execute(): void

    abstract undo(): void

    abstract update(command: this): void

    getAttributeName() {
        return toPath(this.attributePath);
    }

    toJSON(): CommandJson {
        return {
            type: this.type,
            id: this.id,
            name: this.name
        };
    }

    fromJSON(json: CommandJson): void {
        this.inMemory = true;
        this.type = json.type;
        this.id = json.id;
        this.name = json.name;
    }
}
