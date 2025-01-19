import {AbstractMesh, AnimationGroup, Mesh, Node, SceneSerializer, TransformNode} from "@babylonjs/core";
import {isMesh, isTransformNode} from "@plum-render/babylon-type-guard";
import {includes, isArray, max, split} from "lodash-es";
import {Subject} from "rxjs";
import pako from "pako";
import {BlobReader, BlobWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader, ZipWriter} from "@zip.js/zip.js";
import {Package} from "./Package";
import {SerializeViewer} from "./serialize";
import { IBasePlumOptions } from "../core";
import { SceneSerializeObject } from "./SerializeJsonType";
import { SerializerTool } from "./SerializerTool";

export interface ISerializeSubject {
    blob: Blob;
    index: string;
    isEnd: boolean;
}

export interface ReaderInfo {
    index: number;
    reader: Uint8ArrayReader;
}

export interface IPartSerializeOptions extends IBasePlumOptions {
}

/**
 * 对场景进行分包序列化, 可以分片加载
 */
export class PartPackage extends Package {
    static Type = "PartPackage";
    // 分包的索引
    packIndex = 0;
    serializeSubject = new Subject<ISerializeSubject>();
    nodeLevelMap = new Map<number, Array<Node>>();
    readerInfoArray: Array<ReaderInfo> = []
    config = {
        level: 3,
        minPackSize: 4 * 1024 * 1024,
        maxPackSize: 5 * 1024 * 1024
    }
    // zip 包索引
    zipIndex = 1
    isEndPack = false;
    allPackNumber = 2
    firstSceneJson!: SceneSerializeObject = {}

    constructor(options: IPartSerializeOptions) {
        super(options);
    }

    nodeLevelMapAdd(level: number, node: Node | Mesh | TransformNode) {
        const levelArray = this.nodeLevelMap.get(level);
        if (levelArray) {
            levelArray.push(node)
        } else {
            this.nodeLevelMap.set(level, [node])
        }
    }

    async pack() {
        console.log(this.scene)
        // const backScene = new Scene();

        const rootNodes = this.scene.rootNodes.slice(0);


        let firstNodeArray: Array<Node> = []

        // 打包深度
        // packConfig.layer
        for (let index = 0; index < rootNodes.length; index++) {
            const rootNode = rootNodes[index];

            if (isMesh(rootNode)) {
                // 普通网格直接处理
                if (rootNode.getTotalVertices() > 0) {
                    firstNodeArray.push(rootNode)
                } else {
                    SerializerTool.initReservedDataStore(rootNode)
                    rootNode.reservedDataStore.level = 1;
                    this.nodeLevelMapAdd(1, rootNode)

                    // 优化 这里用递归
                    rootNode.getChildMeshes(false, (node: Node) => {
                        // console.log("node", node)
                        if (isTransformNode(node)) {
                            SerializerTool.initReservedDataStore(node)
                            node.reservedDataStore.level = node.parent!.reservedDataStore.level + 1;
                            console.log("node.reservedDataStore.level", node.reservedDataStore.level)
                            if (node.reservedDataStore.level <= this.config.level) {
                                this.nodeLevelMapAdd(node.reservedDataStore.level, node)
                            }
                            return true;
                        }
                        return false;
                    })
                }
            } else {
                firstNodeArray.push(rootNode)
            }
        }
        console.log("firstNodeArray", firstNodeArray)
        console.log('nodeLevelMap', this.nodeLevelMap)

        const firstNodeArrayObject = this.serializeMeshArray(firstNodeArray);
        console.log("firstNodeArrayObject", firstNodeArrayObject)
        const sceneObject = await new SerializeViewer(this.viewer).serializeAsync();
        console.log("sceneObject", sceneObject)


        const baseJson = {...firstNodeArrayObject, ...sceneObject, allPackNumber: this.getAllPackNumber()}
        console.log(this.nodeLevelMap)
        console.log("baseJson.allPackNumber", baseJson.allPackNumber)
        console.log('baseJson', baseJson)

        // return
        let blob = await this.createUint8ArrayReaderBlob(baseJson);
        this.packIndex += 1
        this.serializeSubject.next({
            blob,
            isEnd: false,
            index: String(this.zipIndex),
        })

        const maxLevel = this.nodeLevelMap.size;
        console.log('maxLevel', maxLevel)

        for (const [level, nodeArray] of this.nodeLevelMap) {
            // console.log('level', level)
            // console.log('nodeArray', nodeArray)

            for (let index = 0; index < nodeArray.length; index++) {
                const node = nodeArray[index]
                // console.log("node", node)
                // const serializedMesh = SceneSerializer.SerializeMesh(node, false, withChildren);
                // console.log(serializedMesh)

                const serializeJson = this.serializeMesh(node);
                console.log("serializeJson", serializeJson)

                // 每创建一个包 +1
                this.packIndex += 1
                let uint8ArrayReader = SerializerTool.createUint8ArrayReaderPack(serializeJson);


                this.isEndPack = this.getMaxLevel() === level && index === nodeArray.length - 1

                this.readerInfoArray.push({
                    reader: uint8ArrayReader,
                    index: this.packIndex
                })
                if (this.isMerge()) {
                    await this.nextZipBlob();
                }
            }
        }
        // 还有剩余的包, 直接发送
        if (this.readerInfoArray.length !== 0 && this.isEndPack) {
            await this.nextZipBlob();
        }
    }

    async nextZipBlob() {
        let blob = await this.createZipBlob(this.readerInfoArray);
        this.zipIndex += 1
        this.serializeSubject.next({
            blob,
            isEnd: this.isEndPack,
            index: String(this.zipIndex),
        })
        this.readerInfoArray = []
    }

    getAllPackNumber() {
        let num = 1;
        for (const [level, nodeArray] of this.nodeLevelMap) {
            num += nodeArray.length;
        }
        return num;
    }

    serializeMeshArray(array: Array<Node>) {
        const serializedMesh = SceneSerializer.SerializeMesh(array, false, true);
        return serializedMesh
    }

    // 去除骨骼中重复的
    removeRepeat(json: SceneSerializeObject) {
        if (isArray(json.skeletons) && json.skeletons.length > 1) {
            const isRepeat = json.skeletons[0].id === json.skeletons[1].id
            if (isRepeat) {
                json.skeletons.pop();
            }
        }
    }

    getChildTransformNodes(node: Node) {
        return node.getChildMeshes(true).filter((item) => isTransformNode(item));
    }

    serializeMesh(node: Node) {
        const array = [node]
        let childMeshes = node.getChildMeshes(true);
        // console.log("childMeshes", childMeshes);
        let childTransformNodes = this.getChildTransformNodes(node);
        // console.log("ChildTransformNodes", childTransformNodes);
        if (node.name === "T3CF3_隔离带_001") {
            //
        }
        if (childMeshes.length !== childTransformNodes.length) {
            // 下面没有变化节点, 也把 子网格加上
            array.push(...childMeshes)
        }
        const isWithChildren = this.isWithChildren(node);
        // console.log("isWithChildren",isWithChildren)

        const serializedMesh = SceneSerializer.SerializeMesh(array, false, isWithChildren);
        console.log(serializedMesh);
        // todo  材质会有重复导出
        this.removeRepeat(serializedMesh);
        return serializedMesh
    }

    // ------------- 压缩包创建

    isWithChildren(node: Node) {
        const maxLevel = this.nodeLevelMap.size;
        const level = node.reservedDataStore.level
        if (maxLevel === level) {
            return true
        } else {
            return false
        }
    }

    override async unpack() {

    }

    createPakoBlob(value: object) {
        let pack = SerializerTool.createPakoPack(value);
        return new Blob([pack], {type: "octet/stream"});
    }

    getMaxLevel() {
        return max(this.nodeLevelMap.keys().toArray());
    }

    // 是否合并包
    isMerge() {
        // 使用 reduce 方法计算 size 的总和
        const totalSize = this.readerInfoArray.reduce((accumulator, item) => {
            return accumulator + item.reader.size;
        }, 0); // 初始值为 0
        // 返回总和是否大于 minSize
        return totalSize > this.config.maxPackSize || ((this.config.maxPackSize > totalSize) && (totalSize > this.config.minPackSize));
    }

    async createUint8ArrayReaderBlob(value: object) {
        let uint8ArrayReader = SerializerTool.createUint8ArrayReaderPack(value);

        console.log(uint8ArrayReader.size);

        const zipWriter = new ZipWriter(new BlobWriter());
        await zipWriter.add("1.scenePart", uint8ArrayReader, {
            // onprogress: onProgress
        });
        // close 只有文件级别的进度
        return new Blob([await zipWriter.close()], {type: "octet/stream"});
    }

    async createZipBlob(readerInfoArray: Array<ReaderInfo>) {
        const zipWriter = new ZipWriter(new BlobWriter());

        for (let i = 0; i < readerInfoArray.length; i++) {
            const readerInfo = readerInfoArray[i];
            let name = `${readerInfo.index}.scenePart`;
            // console.log("name", name)
            await zipWriter.add(name, readerInfo.reader, {
                // onprogress: onProgress
            });
        }

        // close 只有文件级别的进度
        return new Blob([await zipWriter.close()], {type: "octet/stream"});
    }

    //------------------- 解析包
    parseZip(blob: Blob) {

    }

    //------------------ 加载包
    async add() {
        this.partSerialize.serialize(this.viewer.scene).then(() => {
        })
        const options = this.viewer.options;
        const {appId, packagePath} = options;
        this.partSerialize.serializeSubject.subscribe(event => {
            // return
            const {blob, index} = event;
            console.log("name", index)
            console.log(event);
            this.viewer?.cosApi.uploadFile({
                Body: blob,
                Key: `${appId}/${index}.babylonZip`,
                onProgress: (progressData) => {
                    console.log("progressData", progressData)
                }
            }).then((data) => {
                console.log(data)
            })
        })
    }

    /**
     * 获取cos的远程场景文件
     * @param zipPackIndex
     */
    getPack(zipPackIndex: number = 1) {

        console.log("zipPackIndex", zipPackIndex)

        const options = this.viewer.options;
        const {appId, packagePath} = options;
        let Key = `${appId}/${zipPackIndex}.babylonZip`
        this.viewer.cosApi.getObject({
            Key: Key,
            DataType: 'blob',
        }).then(async (data) => {
            await this.parseZipPack(data.Body as Blob, zipPackIndex);
        }).catch((err) => {
            console.log(err)
        })
    }

    /**
     * 获取远程场景文件, 可加载离线场景
     */
    getPackByPath(zipPackIndex: number = 1) {
        const options = this.viewer.options;
        const {appId, packagePath} = options;
        let Key = `${appId}/${zipPackIndex}.babylonZip`

        fetch(`${packagePath}/${Key}`).then(res => res.blob()).then(async (blob) => {
            await this.parseZipPack(blob, zipPackIndex);
        }).catch((err) => {
            console.log(err)
            this.viewer.setInitState()
        })
    }

    async parseZipPack(blob: Blob, zipPackIndex: number = 1) {
        const zipFileReader = new BlobReader(blob);
        const zipReader = new ZipReader(zipFileReader);
        const entries = await zipReader.getEntries();
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            if (includes(entry.filename, "scenePart") && entry.getData) {
                console.log("entry.filename", entry.filename)
                let [packIndex] = split(entry.filename, '.')
                const uint8ArrayWriter = await entry.getData(new Uint8ArrayWriter(), {
                    onprogress: (progress: number, total: number) => {
                        //     this.viewer.sceneLoadProgressSubject.next({
                        //         type: "unZip",
                        //         total: total,
                        //         progress: progress
                        //     });
                        return undefined;
                    }
                });
                const sceneJsonString = pako.inflate(uint8ArrayWriter, {to: "string"});
                if (zipPackIndex === 1) {
                    // 加载其他的包
                    let sceneJson = JSON.parse(sceneJsonString);
                    this.firstSceneJson = sceneJson;
                    this.allPackNumber = sceneJson.allPackNumber;
                    console.log(this.allPackNumber)
                }
                console.log("sceneJsonString", JSON.parse(sceneJsonString))

                let file = new File([sceneJsonString], "scene.scenePart");

                // 任务加载成功
                const taskSuccess = (task: any) => {
                    // this.allPackNumber = 1
                    // 最后一个包
                    if (`sceneLoad-${packIndex}` === `sceneLoad-${this.allPackNumber}`) {
                        // console.log("this.viewer.scene.rootNodes", this.viewer.scene.rootNodes)

                        // this.connectingParents()
                        this.revertAnimationGroup();
                        this.boneLinkTransformNode();
                        this.freezeWorldMatrix();

                        this.viewer.setInitState()
                        return
                    }
                    // console.log("task", task)
                    // zip 中最后一个文件处理完成后, 开始加载下一个包
                    if (i === entries.length - 1 && Number(packIndex) !== this.allPackNumber) {
                        this.getPack(zipPackIndex + 1);
                    } else {
                        // this.viewer.setInitState()
                    }
                }

                if (zipPackIndex === 1) {
                    // 第一个包, 使用 加载场景 的方式
                    let sceneAssetTask = this.viewer.assetsManager.addPlumSceneTask(`sceneLoad-${packIndex}`, "", "file:", file);
                    sceneAssetTask.onSuccess = taskSuccess
                    this.viewer.assetsManager.load();
                } else {
                    let meshAssetTask = this.viewer.assetsManager.addPlumMeshTask(`sceneLoad-${packIndex}`, "", "file:", file);
                    meshAssetTask.onSuccess = taskSuccess
                    this.viewer.assetsManager.load();
                }
            }
        }
        await zipReader.close();
    }


    //------------------------------ 把每次导入时做的, 延后处理
    /**
     * 还原动画
     */
    revertAnimationGroup() {
        if (this.firstSceneJson.animationGroups) {
            let animationGroups = this.firstSceneJson.animationGroups as Array<any>;
            for (let i = 0; i < animationGroups.length; i++) {
                const parsedAnimationGroup = animationGroups[i];
                const animationGroup = AnimationGroup.Parse(parsedAnimationGroup, this.viewer.scene);
            }
        }
    }

    /**
     * 加载结束后, 链接骨骼和变化
     */
    boneLinkTransformNode() {
        const skeletons = this.viewer.scene.skeletons;
        for (let i = 0; i < skeletons.length; i++) {
            const skeleton = skeletons[i];
            if (skeleton._hasWaitingData) {
                if (skeleton.bones != null) {
                    skeleton.bones.forEach((bone) => {
                        if (bone._waitingTransformNodeId) {
                            const linkTransformNode = this.viewer.scene.getLastEntryById(bone._waitingTransformNodeId) as TransformNode;
                            if (linkTransformNode) {
                                bone.linkTransformNode(linkTransformNode);
                            }
                            bone._waitingTransformNodeId = null;
                        }
                    });
                }
                skeleton._hasWaitingData = null;
            }
        }
    }

    /**
     * 链接父级
     */
    connectingParents() {
        const transformNodes = this.viewer.scene.transformNodes;
        for (let i = 0; i < transformNodes.length; i++) {
            const transformNode = transformNodes[i];
            if (transformNode._waitingParentId !== null) {
                let parent = parsedIdToNodeMap.get(parseInt(transformNode._waitingParentId)) || null;
                if (parent === null) {
                    parent = this.viewer.scene.getLastEntryById(transformNode._waitingParentId);
                }
                let parentNode = parent;
                if (transformNode._waitingParentInstanceIndex) {
                    parentNode = (parent as Mesh).instances[parseInt(transformNode._waitingParentInstanceIndex)];
                    transformNode._waitingParentInstanceIndex = null;
                }
                transformNode.parent = parentNode;
                transformNode._waitingParentId = null;
            }
        }
        let currentMesh: AbstractMesh;
        const meshes = this.viewer.scene.meshes;
        for (let i = 0; i < meshes.length; i++) {
            currentMesh = meshes[i];
            if (currentMesh._waitingParentId) {
                let parent = parsedIdToNodeMap.get(parseInt(currentMesh._waitingParentId)) || null;
                if (parent === null) {
                    parent = this.viewer.scene.getLastEntryById(currentMesh._waitingParentId);
                }
                let parentNode = parent;
                if (currentMesh._waitingParentInstanceIndex) {
                    parentNode = (parent as Mesh).instances[parseInt(currentMesh._waitingParentInstanceIndex)];
                    currentMesh._waitingParentInstanceIndex = null;
                }
                currentMesh.parent = parentNode;
                currentMesh._waitingParentId = null;
            }
            if (currentMesh._waitingData.lods) {
                loadDetailLevels(this.viewer.scene, currentMesh);
            }
        }
    }

    /**
     * 冻结矩阵计算
     */
    freezeWorldMatrix() {
        let currentMesh: AbstractMesh;
        const meshes = this.viewer.scene.meshes;
        for (let i = 0; i < meshes.length; i++) {
            currentMesh = meshes[i];
            if (currentMesh._waitingData.freezeWorldMatrix) {
                currentMesh.freezeWorldMatrix();
                currentMesh._waitingData.freezeWorldMatrix = null;
            } else {
                currentMesh.computeWorldMatrix(true);
            }
        }
    }

    loadScene(): void {
    }
}