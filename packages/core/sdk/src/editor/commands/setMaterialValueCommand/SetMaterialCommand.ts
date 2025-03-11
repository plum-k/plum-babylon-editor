import {Command} from "../Command";

export class SetMaterialCommand extends Command<THREE.Material | null> {
    type: string = 'SetMaterialCommand';
    materialSlot: number;

    constructor(object: AbstractMesh, newValue: THREE.Material, materialSlot: number = -1) {
        super();

        this.name = 'command/SetMaterial';

        this.object = object;
        this.materialSlot = materialSlot;

        this.oldValue = isMesh(object) ? Tool.getObjectMaterial(object, materialSlot) : null;
        this.newValue = newValue;
    }

    execute(): void {
        Tool.setObjectMaterial(this.object as THREE.Mesh, this.materialSlot, this.newValue as THREE.Material);
        // this.editor.signals.materialChanged.dispatch(this.object, this.materialSlot);
    }

    undo(): void {
        Tool.setObjectMaterial(this.object as THREE.Mesh, this.materialSlot, this.oldValue as THREE.Material);
        // this.editor.signals.materialChanged.dispatch(this.object, this.materialSlot);
    }

    toJSON(): any {
        const output = super.toJSON();

        output.objectUuid = this.object?.uuid;
        output.oldValue = this.oldValue?.toJSON();
        output.newValue = this.newValue?.toJSON();
        output.materialSlot = this.materialSlot;

        return output;
    }

    fromJSON(json: any): void {
        super.fromJSON(json);

        this.object = this.editor.objectByUuid(json.objectUuid)!;
        this.oldValue = parseMaterial(json.oldValue);
        this.newValue = parseMaterial(json.newValue);
        this.materialSlot = json.materialSlot;

        function parseMaterial(json: any): Material | null {
            const loader = new ObjectLoader();
            const images = loader.parseImages(json.images);
            const textures = loader.parseTextures(json.textures, images);
            const materials = loader.parseMaterials([json], textures);
            return materials[json.uuid] || null;
        }
    }
}