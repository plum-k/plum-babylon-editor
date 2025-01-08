import {Package} from "./Package";
import {PartPackage} from "./PartPackage";
import {Viewer} from "../core";
import {ChunkSerialize} from "./ChunkPackage";

const packageMap = new Map<string, typeof Package>();

packageMap.set(ChunkSerialize.Type, ChunkSerialize);
packageMap.set(PartPackage.Type, PartPackage);

export {packageMap}

export function getPackage(viewer: Viewer): Package | null {
    const {packageType} = viewer.options;
    if (packageType) {
        const serializer = packageMap.get(packageType);
        if (serializer) {
            return Reflect.construct(serializer, [{viewer}])
        }
        return null;
    }
    return null;
}


