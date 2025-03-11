import {ISetVector3Command, SetObjectVector3Command} from "./SetObjectVector3Command";

export class SetScaleCommand extends SetObjectVector3Command {
    constructor(option: ISetVector3Command) {
        super(option);
    }
}