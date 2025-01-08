import {split} from "lodash-es";
import {AbstractMesh} from "@babylonjs/core";

let debugNum = 0

export class Tool {


    static getBase64FromTexture() {

    }

// 从base64字符串创建Texture
    static getTextureFromBase64(base64: string) {

    }

    static getObjectByUuid(node: AbstractMesh, uuid: string) {
        // return node.getObjectByProperty('uuid', uuid);
    }

    static throw() {
        throw new Error("")
    }

    static throwNum(num: number) {
        if (debugNum === num) {
            debugNum = 0
            throw new Error("")
        }
        debugNum += 1
    }

    static reflectGet(node: any, name: string) {
        return Reflect.get(node, name);
    }

    static reflectSet(node: any, name: string, value: string) {
        return Reflect.set(node, name, value);
    }

    static isUrl(string: string) {
        try {
            new URL(string);
            return true;
        } catch (err) {
            return false;
        }
    }

    static getFileName(value: string) {
        return split(value, '.', 2);
    }
}