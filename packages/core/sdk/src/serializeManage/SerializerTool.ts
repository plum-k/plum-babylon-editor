import pako, {Data} from "pako";
import {Uint8ArrayReader} from "@zip.js/zip.js";
import {Node} from "@babylonjs/core";
import {flow} from "lodash-es";

export class SerializerTool {

    static objectToString(value: object) {
        return JSON.stringify(value);
    }

    static stringToObject(value: string) {
        return JSON.parse(value);
    }

    static pakoDeflate(value: string | Data) {
        return pako.deflate(value);
    }

    static pakoInflate(uint8ArrayWriter: Uint8Array<ArrayBufferLike>) {
        return pako.inflate(uint8ArrayWriter, {to: "string"});
    }

    static parseUint8ArrayReaderPack(value: Uint8Array<ArrayBufferLike>) {
        return flow([SerializerTool.pakoInflate, SerializerTool.stringToObject])(value);
    }

    static createPakoPack(value: object) {
        return flow([SerializerTool.objectToString, SerializerTool.pakoDeflate])(value);
    }

    static createUint8ArrayReader(value: Uint8Array) {
        return new Uint8ArrayReader(value)
    }

    static createUint8ArrayReaderPack(value: object): Uint8ArrayReader {
        return flow([SerializerTool.objectToString, SerializerTool.pakoDeflate, SerializerTool.createUint8ArrayReader])(value);
    }


    static initMetadata(node: Node) {
        if (!node.metadata) {
            node.metadata = {};
        }
    }

    static initReservedDataStore(node: Node) {
        if (!node.reservedDataStore) {
            node.reservedDataStore = {};
        }
    }
}



