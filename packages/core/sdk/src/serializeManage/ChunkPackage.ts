import {chunk, isNil} from "lodash-es";
import {BlobReader, BlobWriter, Entry, Uint8ArrayWriter, ZipReader, ZipWriter} from "@zip.js/zip.js";

import {Package} from "./Package";
import {IBasePlumOptions} from "../core";
import {SerializerTool} from "./SerializerTool";
import {SceneSerializeObject} from "./SerializeJsonType";
import {ChunkDeserialize} from "./deserialize";
import {SerializeViewer} from "./serialize";

export interface IChunkSerializeOptions extends IBasePlumOptions {
}


/**
 * 大场景对象序列化为json时, 会因为超出长度, 而失败, 需要把对象分块打包
 */
export class ChunkSerialize extends Package {
    static Type = "chunk";

    constructor(options: IChunkSerializeOptions) {
        super(options);
    }

    loadScene(): void {
        const options = this.viewer.options;
        const {appId, packagePath} = options;
        let Key = `${appId}/${appId}.${ChunkSerialize.Type}`
        if (isNil(appId)) {
            throw new Error("appId 为空");
        }
        if (isNil(packagePath) && !isNil(this.viewer.cosApi)) {
            // 从远程存储加载场景
            this.viewer.cosApi.headObject(Key).then((data) => {
                this.viewer.cosApi!.getObject({
                    Key: Key,
                    DataType: 'blob',
                }).then(async (data) => {
                    await this.unpack(data.Body as Blob);
                }).catch((err) => {
                    console.log(err)
                    this.viewer.setInitState()
                })
            }).catch((err) => {
                // console.log(err)
                if (err.statusCode === 404) {
                    console.log('对象不存在');
                } else if (err.statusCode == 403) {
                    console.log('没有该对象读权限');
                }
                this.viewer.setInitState()
            })
        } else {
            // 加载离线的包
            this.getPackByPath()
        }
    }

    override async pack() {
        const sceneObject = await new SerializeViewer(this.viewer).serializeAsync() as SceneSerializeObject;

        console.log("打包场景数据", sceneObject)
        const {geometries, materials} = sceneObject;
        const {vertexData} = geometries;
        const vertexDataBlob = await this.packMaterialsOrVertexData(vertexData, "vertexData", 100);
        const materialsBlob = await this.packMaterialsOrVertexData(materials, "materials", 300);

        const zipWriter = new ZipWriter(new BlobWriter());

        const sceneInfo = this.packSceneInfo(sceneObject);

        await zipWriter.add("sceneInfo.bin", sceneInfo);
        await zipWriter.add("vertexData.zip", new BlobReader(vertexDataBlob));
        await zipWriter.add("materials.zip", new BlobReader(materialsBlob));

        const blob = new Blob([await zipWriter.close()], {type: "octet/stream"});
        this.uploadPack(blob);
    }

    override async unpack(blob: Blob) {
        const zipFileReader = new BlobReader(blob);
        const zipReader = new ZipReader(zipFileReader);
        const entries = await zipReader.getEntries();

        let sceneInfo = {} as SceneSerializeObject

        let materials: Array<any> = []
        let vertexData: Array<any> = []

        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            if (entry.filename === "sceneInfo.bin" && entry.getData) {
                sceneInfo = await this.unPackSceneInfo(entry);
            }
            if (entry.filename === "vertexData.zip" && entry.getData) {
                vertexData = await this.unPackMaterialsOrVertexData(entry);
            }
            if (entry.filename === "materials.zip" && entry.getData) {
                materials = await this.unPackMaterialsOrVertexData(entry);
            }
        }
        await zipReader.close();
        sceneInfo.materials = materials;
        sceneInfo.geometries.vertexData = vertexData;
        console.log("还原场景数据", sceneInfo)
        const babylonChunkFileLoader = new ChunkDeserialize(this.viewer);
        await babylonChunkFileLoader.loadAsync(this.viewer.scene, sceneInfo, "")
        this.viewer.setInitState()
    }


    /**
     * 获取远程场景文件, 可加载离线场景
     */
    getPackByPath() {
        const options = this.viewer.options;
        const {appId, packagePath} = options;

        fetch(`${packagePath}/${appId}.chunk`).then(res => res.blob()).then(async (blob) => {
            await this.unpack(blob);
        }).catch((err) => {
            console.log(err)
            this.viewer.setInitState()
        })
    }

    packSceneInfo(sceneObject: SceneSerializeObject) {
        sceneObject.geometries.vertexData = [];
        sceneObject.materials = [];
        return SerializerTool.createUint8ArrayReaderPack(sceneObject);
    }

    async unPackSceneInfo(entry: Entry) {
        const uint8ArrayWriter = await entry.getData!(new Uint8ArrayWriter(), {
            onprogress: (progress: number, total: number) => {
                // this.sceneLoadProgressSubject.next({
                //     type: "unZip",
                //     total: total,
                //     progress: progress
                // });
                return undefined;
            }
        });

        return SerializerTool.parseUint8ArrayReaderPack(uint8ArrayWriter);
    }

    // 打包材质或顶点
    async packMaterialsOrVertexData(materials: Array<any>, name: string, size: number) {
        const chunkedArray = chunk(materials, size);
        const zipWriter = new ZipWriter(new BlobWriter());
        for (let i = 0; i < chunkedArray.length; i++) {
            const chunk = chunkedArray[i];
            const uint8ArrayReader = SerializerTool.createUint8ArrayReaderPack(chunk);
            await zipWriter.add(`${name}-chunk-${i}.bin`, uint8ArrayReader, {
                // onprogress: onProgress
            });
        }
        return new Blob([await zipWriter.close()], {type: "octet/stream"});
    }

    async unPackMaterialsOrVertexData(entry: Entry) {
        const blob = await entry.getData!(new BlobWriter(), {
            onprogress: (progress: number, total: number) => {
                // this.sceneLoadProgressSubject.next({
                //     type: "unZip",
                //     total: total,
                //     progress: progress
                // });
                return undefined;
            }
        });

        const zipFileReader = new BlobReader(blob);
        const zipReader = new ZipReader(zipFileReader);
        const entries = await zipReader.getEntries();

        let jsonArray = []

        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            if (entry.getData) {
                const uint8ArrayWriter = await entry.getData!(new Uint8ArrayWriter(), {
                    onprogress: (progress: number, total: number) => {
                        // this.sceneLoadProgressSubject.next({
                        //     type: "unZip",
                        //     total: total,
                        //     progress: progress
                        // });
                        return undefined;
                    }
                });
                let json = SerializerTool.parseUint8ArrayReaderPack(uint8ArrayWriter);
                jsonArray.push(...json);
            }
        }
        await zipReader.close();
        return jsonArray;
    }


    uploadPack(blob: Blob) {
        const appId = this.viewer.options.appId;
        if (!isNil(this.viewer.cosApi)) {
            this.viewer.cosApi.uploadFile({
                Body: blob,
                Key: `${appId}/${appId}.${ChunkSerialize.Type}`,
                onProgress: (progressData) => {
                    console.log("progressData", progressData)
                }
            }).then((data) => {
                console.log(data)
            })
        }
    }
}