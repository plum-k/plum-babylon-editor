import {chunk, isNil, split} from "lodash-es";
import {BlobReader, BlobWriter, Entry, Uint8ArrayWriter, ZipReader, ZipWriter} from "@zip.js/zip.js";
import {Package} from "./Package";
import {ESceneLoadType, ESceneSaveType, IComponentOptions} from "../../core";
import {SerializerTool} from "../SerializerTool";
import {SceneSerializeObject} from "../SerializeJsonType";
import {ChunkDeserialize} from "../deserialize";
import {SerializeViewer} from "../serialize";
import axios, {AxiosProgressEvent} from 'axios';

export interface IChunkSerializeOptions extends IComponentOptions {
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
        this.viewer.sceneLoadProgressSubject.next({
            type: ESceneLoadType.Load,
            name: `加载场景中`,
            total: 1,
            loaded: 0,
        })
        const options = this.viewer.options;
        const {appId, packagePath} = options;
        let Key = `${appId}/${appId}.${ChunkSerialize.Type}`
        if (isNil(appId)) {
            throw new Error("appId 为空");
        }
        if (isNil(packagePath) && !isNil(this.viewer.ossApi)) {
            // 从远程存储加载场景
            this.viewer.ossApi.head(Key).then((data) => {
                const url = this.viewer.ossApi!.signatureUrl(Key);
                axios.get(url, {
                    responseType: "blob",
                    onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
                        const total = progressEvent.total;
                        const loaded = progressEvent.loaded;
                        if (total) {
                            const percentCompleted = Math.round((loaded * 100) / total);
                            // console.log(`下载进度: ${percentCompleted}%`);
                            this.viewer.sceneLoadProgressSubject.next({
                                type: ESceneLoadType.Down,
                                name: "下载场景包中",
                                total: total,
                                loaded: loaded,
                            })
                        }
                    }
                }).then(async (res) => {
                    await this.unpack(res.data);
                }).catch((err) => {
                    console.log(err)
                    this.viewer.setInitState()
                })
            }).catch((error) => {
                if (Reflect.get(error as object, "code") === "NoSuchKey") {
                    console.log("文件不存在");
                }
                this.viewer.setInitState()
            })
        } else {
            // 加载离线的包
            this.getPackByPath()
        }
    }

    override async pack() {
        this.viewer.sceneSaveProgressSubject.next({
            type: ESceneSaveType.Save,
            name: `场景保存中`,
            total: 1,
            loaded: 0,
        })
        const sceneObject = await new SerializeViewer(this.viewer).serializeAsync() as SceneSerializeObject;

        console.log("打包场景数据", sceneObject)
        const {geometries, materials} = sceneObject;
        const {vertexData} = geometries;
        const vertexDataBlob = await this.packMaterialsOrVertexData(vertexData, "vertexData", 100);
        const materialsBlob = await this.packMaterialsOrVertexData(materials, "materials", 300);

        const zipWriter = new ZipWriter(new BlobWriter());

        const sceneInfo = this.packSceneInfo(sceneObject);

        await zipWriter.add("sceneInfo.bin", sceneInfo, {
            onprogress: (progress: number, total: number) => {
                this.viewer.sceneSaveProgressSubject.next({
                    type: ESceneSaveType.Zip,
                    name: `制作场景包中`,
                    total: total,
                    loaded: progress,
                })
                return undefined;
            }
        });
        await zipWriter.add("vertexData.zip", new BlobReader(vertexDataBlob), {
            onprogress: (progress: number, total: number) => {
                this.viewer.sceneSaveProgressSubject.next({
                    type: ESceneSaveType.Zip,
                    name: `制作顶点包中`,
                    total: total,
                    loaded: progress,
                })
                return undefined;
            }
        });
        await zipWriter.add("materials.zip", new BlobReader(materialsBlob), {
            onprogress: (progress: number, total: number) => {
                this.viewer.sceneSaveProgressSubject.next({
                    type: ESceneSaveType.Zip,
                    name: `制作材质包中`,
                    total: total,
                    loaded: progress,
                })
                return undefined;
            }
        });

        const blob = new Blob([await zipWriter.close(undefined)], {type: "octet/stream"});
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
                vertexData = await this.unPackMaterialsOrVertexData(entry, "vertexData");
            }
            if (entry.filename === "materials.zip" && entry.getData) {
                materials = await this.unPackMaterialsOrVertexData(entry, "materials");
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
    async packMaterialsOrVertexData(materials: Array<any>, packName: string, size: number) {
        const chunkedArray = chunk(materials, size);
        const zipWriter = new ZipWriter(new BlobWriter());
        for (let i = 0; i < chunkedArray.length; i++) {
            const chunk = chunkedArray[i];
            const uint8ArrayReader = SerializerTool.createUint8ArrayReaderPack(chunk);
            await zipWriter.add(`${packName}-chunk-${i}.bin`, uint8ArrayReader, {
                onprogress: (progress: number, total: number) => {
                    let isMaterials = packName === "materials"
                    let name = isMaterials ? `压缩材质分包 ${i}` : `压缩顶点分包 ${i}`
                    this.viewer.sceneSaveProgressSubject.next({
                        type: ESceneSaveType.Zip,
                        name: name,
                        total: total,
                        loaded: progress,
                    })
                    return undefined;
                }
            });
        }
        return new Blob([await zipWriter.close(undefined,)], {type: "octet/stream"});
    }

    /**
     * 解包材质或顶点
     */
    async unPackMaterialsOrVertexData(entry: Entry, type: string) {
        let isMaterials = type === "materials"
        const blob = await entry.getData!(new BlobWriter(), {
            onprogress: (progress: number, total: number) => {
                let name = isMaterials ? `解压材质包中` : `解压顶点包中`
                this.viewer.sceneLoadProgressSubject.next({
                    type: ESceneLoadType.UnZip,
                    name: name,
                    total: total,
                    loaded: progress,
                })
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
                        const parts = split(entry.filename, '-');
                        const filename = parts[parts.length - 1];
                        const index = filename.slice(0, -4);
                        let name = isMaterials ? `提取材质分包 ${index}` : `提取顶点分包 ${index}`
                        this.viewer.sceneLoadProgressSubject.next({
                            type: ESceneLoadType.UnZip,
                            name: name,
                            total: total,
                            loaded: progress,
                        })
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
        if (!isNil(this.viewer.ossApi)) {
            const name = `${appId}/${appId}.${ChunkSerialize.Type}`;
            this.viewer.ossApi.put(name, blob).then((data) => {
                console.log(data)
                this.viewer.sceneSaveProgressSubject.next({
                    type: ESceneSaveType.Save,
                    name: `场景保存中`,
                    total: 1,
                    loaded: 1,
                })
            })
        }
    }
}