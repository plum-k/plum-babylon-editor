import { Observable } from "../Misc/observable.js";
import { FlowGraph } from "./flowGraph.js";
import { defaultValueParseFunction } from "./serialization.js";
/**
 * This class holds all of the existing flow graphs and is responsible for creating new ones.
 * It also handles starting/stopping multiple graphs and communication between them through an Event Coordinator
 */
export class FlowGraphCoordinator {
    constructor(
    /**
     * the configuration of the block
     */
    config) {
        this.config = config;
        this._flowGraphs = [];
        this._customEventsMap = new Map();
        // When the scene is disposed, dispose all graphs currently running on it.
        this.config.scene.onDisposeObservable.add(() => {
            this.dispose();
        });
        // Add itself to the SceneCoordinators list for the Inspector.
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(this.config.scene) ?? [];
        coordinators.push(this);
    }
    /**
     * Creates a new flow graph and adds it to the list of existing flow graphs
     * @returns a new flow graph
     */
    createGraph() {
        const graph = new FlowGraph({ scene: this.config.scene, coordinator: this });
        this._flowGraphs.push(graph);
        return graph;
    }
    /**
     * Removes a flow graph from the list of existing flow graphs and disposes it
     * @param graph the graph to remove
     */
    removeGraph(graph) {
        const index = this._flowGraphs.indexOf(graph);
        if (index !== -1) {
            graph.dispose();
            this._flowGraphs.splice(index, 1);
        }
    }
    /**
     * Starts all graphs
     */
    start() {
        this._flowGraphs.forEach((graph) => graph.start());
    }
    /**
     * Disposes all graphs
     */
    dispose() {
        this._flowGraphs.forEach((graph) => graph.dispose());
        this._flowGraphs.length = 0;
        // Remove itself from the SceneCoordinators list for the Inspector.
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(this.config.scene) ?? [];
        const index = coordinators.indexOf(this);
        if (index !== -1) {
            coordinators.splice(index, 1);
        }
    }
    /**
     * Serializes this coordinator to a JSON object.
     * @param serializationObject the object to serialize to
     * @param valueSerializeFunction the function to use to serialize the value
     */
    serialize(serializationObject, valueSerializeFunction) {
        serializationObject._flowGraphs = [];
        this._flowGraphs.forEach((graph) => {
            const serializedGraph = {};
            graph.serialize(serializedGraph, valueSerializeFunction);
            serializationObject._flowGraphs.push(serializedGraph);
        });
    }
    /**
     * Parses a serialized coordinator.
     * @param serializedObject the object to parse
     * @param options the options to use when parsing
     * @returns the parsed coordinator
     */
    static Parse(serializedObject, options) {
        const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
        const coordinator = new FlowGraphCoordinator({ scene: options.scene });
        serializedObject._flowGraphs?.forEach((serializedGraph) => {
            FlowGraph.Parse(serializedGraph, { coordinator, valueParseFunction, pathConverter: options.pathConverter });
        });
        return coordinator;
    }
    /**
     * Gets the list of flow graphs
     */
    get flowGraphs() {
        return this._flowGraphs;
    }
    /**
     * Get an observable that will be notified when the event with the given id is fired.
     * @param id the id of the event
     * @returns the observable for the event
     */
    getCustomEventObservable(id) {
        let observable = this._customEventsMap.get(id);
        if (!observable) {
            observable = new Observable();
            this._customEventsMap.set(id, observable);
        }
        return observable;
    }
    /**
     * Notifies the observable for the given event id with the given data.
     * @param id the id of the event
     * @param data the data to send with the event
     */
    notifyCustomEvent(id, data) {
        const observable = this._customEventsMap.get(id);
        if (observable) {
            observable.notifyObservers(data);
        }
    }
}
/**
 * @internal
 * A list of all the coordinators per scene. Will be used by the inspector
 */
FlowGraphCoordinator.SceneCoordinators = new Map();
//# sourceMappingURL=flowGraphCoordinator.js.map