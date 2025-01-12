import {GlowLayer, Node} from "@babylonjs/core";

export function initReservedDataStore(node:Node) {
    if (!node.reservedDataStore){
        node.reservedDataStore = {};
    }
}