import { AbstractMesh } from "../../../Meshes/abstractMesh.js";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock.js";
import { PointerEventTypes } from "../../../Events/pointerEvents.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { _isADescendantOf } from "../../utils.js";
/**
 * @experimental
 * A block that activates when a mesh is picked.
 */
export class FlowGraphMeshPickEventBlock extends FlowGraphEventBlock {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        super(config);
        this.config = config;
    }
    _getReferencedMesh() {
        const iAccessor = this.config.pathConverter.convert(this.config.path);
        const mesh = iAccessor.info.getObject(iAccessor.object);
        if (!mesh || !(mesh instanceof AbstractMesh)) {
            throw new Error("Mesh pick event block requires a valid mesh");
        }
        return mesh;
    }
    /**
     * @internal
     */
    _preparePendingTasks(context) {
        let pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        if (!pickObserver) {
            const mesh = this._getReferencedMesh();
            context._setExecutionVariable(this, "mesh", mesh);
            pickObserver = mesh.getScene().onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERPICK &&
                    pointerInfo.pickInfo?.pickedMesh &&
                    (pointerInfo.pickInfo?.pickedMesh === mesh || _isADescendantOf(pointerInfo.pickInfo?.pickedMesh, mesh))) {
                    this._execute(context);
                }
            });
            const disposeObserver = mesh.onDisposeObservable.add(() => this._onDispose);
            context._setExecutionVariable(this, "meshPickObserver", pickObserver);
            context._setExecutionVariable(this, "meshDisposeObserver", disposeObserver);
        }
    }
    _onDispose(context) {
        this._cancelPendingTasks(context);
        context._removePendingBlock(this);
    }
    /**
     * @internal
     */
    _cancelPendingTasks(context) {
        const mesh = context._getExecutionVariable(this, "mesh");
        const pickObserver = context._getExecutionVariable(this, "meshPickObserver");
        const disposeObserver = context._getExecutionVariable(this, "meshDisposeObserver");
        mesh.getScene().onPointerObservable.remove(pickObserver);
        mesh.onDisposeObservable.remove(disposeObserver);
        context._deleteExecutionVariable(this, "mesh");
        context._deleteExecutionVariable(this, "meshPickObserver");
        context._deleteExecutionVariable(this, "meshDisposeObserver");
    }
    /**
     * @returns class name of the block.
     */
    getClassName() {
        return FlowGraphMeshPickEventBlock.ClassName;
    }
    /**
     * Serializes the block to a JSON object.
     * @param serializationObject the object to serialize to.
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.config.path = this.config.path;
    }
}
/**
 * Class name of the block.
 */
FlowGraphMeshPickEventBlock.ClassName = "FGMeshPickEventBlock";
RegisterClass(FlowGraphMeshPickEventBlock.ClassName, FlowGraphMeshPickEventBlock);
//# sourceMappingURL=flowGraphMeshPickEventBlock.js.map