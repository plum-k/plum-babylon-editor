import {AbstractMesh, Mesh, Scene, SceneSerializer, Tools} from "@babylonjs/core";
import pako from "pako";
import {BlobWriter, TextReader, ZipWriter} from "@zip.js/zip.js";
import {GLTF2Export, OBJExport, STLExport, USDZExportAsync} from "@babylonjs/serializers";

export class ExporterTool {
    exportOBJ(scene: Scene) {
        let objString = OBJExport.OBJ(scene.meshes as Array<Mesh>);
    }

    exportSTL(scene: Scene) {
        STLExport.CreateSTL(scene.meshes as Array<Mesh>)
    }

    exportUSDZ(scene: Scene) {
        USDZExportAsync(scene, {}).then((gltf) => {
        });
    }

    exportGLTF(scene: Scene, fileName: string = "scene") {
        GLTF2Export.GLTFAsync(scene, fileName).then((glb) => {
            glb.downloadFiles();
        });
    }

    exportGLB(scene: Scene, fileName: string = "scene") {
        GLTF2Export.GLBAsync(scene, fileName).then((glb) => {
            glb.downloadFiles();
        });
    }

    // 原生导出 环境图为 file:文件  有问题
    async exportBabylon(scene: Scene, fileName: string = "scene") {
        const sceneObject = await SceneSerializer.SerializeAsync(scene);
        const strScene = JSON.stringify(sceneObject);
        const blob = new Blob([strScene], {type: "octet/stream"});
        Tools.Download(blob, `${fileName}.babylon`);

        // const blob = new Blob([strScene], {type: 'text/plain'});
        // Tools.Download(blob, `${fileName}.json`);
    }

    // todo 进度条, 数据量大的时候会导致 对象转 json 字符串溢出
    async generateSceneBabylonZip(scene: Scene, onProgress: (progress: number, total: number) => undefined) {
        const sceneObject = await SceneSerializer.SerializeAsync(scene);
        const strScene = JSON.stringify(sceneObject);
        let strSceneLen = strScene.length;
        const zipWriter = new ZipWriter(new BlobWriter());
        let textReader = new TextReader(strScene)
        console.log(textReader)
        await zipWriter.add("scene.babylon", textReader, {
            onprogress: onProgress
        });
        // close 只有文件级别的进度
        return new Blob([await zipWriter.close()], {type: "octet/stream"});
    }


    async exportZipTest(scene: Scene) {
        const sceneObject = await SceneSerializer.SerializeAsync(scene);
        console.log("sceneObject", sceneObject)
        const strScene = JSON.stringify(sceneObject);
    }


    // 下载压缩的场景
    async downloadSceneBabylonZip(scene: Scene, fileName: string = "scene") {
        const blob = await this.generateSceneBabylonZip(scene, () => {
            return undefined;
        });
        Tools.Download(blob, `${fileName}.zip`);

        // const blob = new Blob([strScene], {type: 'text/plain'});
        // Tools.Download(blob, `${fileName}.json`);
    }


    // 导出网格
    async meshExportBabylon(mesh: AbstractMesh, withChildren?: boolean, fileName: string = "scene") {
        const serializedMesh = SceneSerializer.SerializeMesh(mesh, false, withChildren);
        const strScene = JSON.stringify(serializedMesh);
        const blob = new Blob([strScene], {type: "octet/stream"});
        Tools.Download(blob, `${fileName}.babylon`);

        // const blob = new Blob([strScene], {type: 'text/plain'});
        // Tools.Download(blob, `${fileName}.json`);
    }

    async meshExportBabylonPako(mesh: AbstractMesh, withChildren?: boolean, fileName: string = "scene") {
        const serializedMesh = SceneSerializer.SerializeMesh(mesh, false, withChildren);
        const strScene = JSON.stringify(serializedMesh);


        const compressed = pako.deflate(JSON.stringify(strScene));
        const blob = new Blob([compressed], {type: "octet/stream"});

        // const restored = JSON.parse(pako.inflate(compressed, { to: 'string' }));
        // const blob = new Blob([strScene], {type: "octet/stream"});
        Tools.Download(blob, `${fileName}.babylon`);

        // const blob = new Blob([strScene], {type: 'text/plain'});
        // Tools.Download(blob, `${fileName}.json`);
    }


    async meshExportBabylonZip(mesh: AbstractMesh, withChildren?: boolean, fileName: string = "scene") {
        const serializedMesh = SceneSerializer.SerializeMesh(mesh, false, withChildren);
        const strScene = JSON.stringify(serializedMesh);

        const zipWriter = new ZipWriter(new BlobWriter());
        const helloWorldReader = new TextReader(strScene);
        await zipWriter.add("hello.txt", new TextReader(strScene));
        const blob = new Blob([await zipWriter.close()], {type: "octet/stream"});
        // const restored = JSON.parse(pako.inflate(compressed, { to: 'string' }));
        // const blob = new Blob([strScene], {type: "octet/stream"});
        Tools.Download(blob, `${fileName}.babylon`);

        // const blob = new Blob([strScene], {type: 'text/plain'});
        // Tools.Download(blob, `${fileName}.json`);
    }
}