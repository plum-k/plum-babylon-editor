import {CSG2, InitializeCSG2Async, ISimplificationSettings, Mesh, SimplificationSettings} from "@babylonjs/core";
import {PScene, Viewer} from "../core";
import {defaults} from "lodash-es";

export interface IMeshTool {
    viewer: Viewer;     // 视图实例的引用
}

export class MeshTool {
    options: IMeshTool;                       // 线段的选项
    viewer!: Viewer;                      // 视图实例
    scene!: PScene;                       // 渲染线段的场景
    constructor(options: IMeshTool) {
        this.options = defaults(options, {}); // 使用 lodash 设置默认选项
        this.viewer = options.viewer;          // 设置视图属性
        this.scene = this.viewer.scene;        // 设置场景属性
    }

    static async init() {
        await InitializeCSG2Async({
            manifoldUrl: "./wasm/manifold-3d",
        });
    }

    /**
     * 将两个网格转换为CSG对象
     * @param InOuterMesh
     * @param inInnerMesh
     */
    fromMesh(InOuterMesh: Mesh, inInnerMesh: Mesh) {
        const outerCSG = CSG2.FromMesh(InOuterMesh);
        const innerCSG = CSG2.FromMesh(inInnerMesh);
        return [outerCSG, innerCSG];
    };

    /**
     * 减去两个网格
     * @param InOuterMesh
     * @param inInnerMesh
     */
    subtract(InOuterMesh: Mesh, inInnerMesh: Mesh) {
        const [outerCSG, innerCSG] = this.fromMesh(InOuterMesh, inInnerMesh);
        const resultCSG = outerCSG.subtract(innerCSG);
        const resultMesh = resultCSG.toMesh("resultMesh", this.scene);

        InOuterMesh.dispose();
        inInnerMesh.dispose();
        outerCSG.dispose();
        innerCSG.dispose();
        return resultMesh;
    };


    /**
     * 交集
     * @param InOuterMesh
     * @param inInnerMesh
     */
    intersect(InOuterMesh: Mesh, inInnerMesh: Mesh) {
        const [outerCSG, innerCSG] = this.fromMesh(InOuterMesh, inInnerMesh);
        const resultCSG = outerCSG.subtract(innerCSG);
        const resultMesh = resultCSG.toMesh("resultMesh", this.scene);
        InOuterMesh.dispose();
        inInnerMesh.dispose();
        outerCSG.dispose();
        innerCSG.dispose();
        return resultMesh;
    };

    /**
     * 并集
     * @param InOuterMesh
     * @param inInnerMesh
     */
    union(InOuterMesh: Mesh, inInnerMesh: Mesh) {
        const [outerCSG, innerCSG] = this.fromMesh(InOuterMesh, inInnerMesh);
        const resultCSG = outerCSG.subtract(innerCSG);
        const resultMesh = resultCSG.toMesh("resultMesh", this.scene);
        InOuterMesh.dispose();
        inInnerMesh.dispose();
        outerCSG.dispose();
        innerCSG.dispose();
        return resultMesh;
    };

    /**
     * 合并网格
     * @param meshes
     * @param disposeSource
     * @param allow32BitsIndices
     * @param meshSubclass
     * @param subdivideWithSubMeshes
     * @param multiMultiMaterials
     */
    mergeMeshes(meshes: Mesh[], disposeSource?: boolean, allow32BitsIndices?: boolean, meshSubclass?: Mesh, subdivideWithSubMeshes?: boolean, multiMultiMaterials?: boolean) {
        const newMesh = Mesh.MergeMeshes(meshes, disposeSource, allow32BitsIndices, meshSubclass, subdivideWithSubMeshes, multiMultiMaterials);
    }


    /**
     * 自动lod
     * @param mesh
     * @param array
     */
    autoLod(mesh: Mesh, array?: [number, number, boolean?][]) {
        const settings: Array<ISimplificationSettings> = [];
        const _array = array || [[0.8, 60], [0.4, 150]];
        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            settings.push(new SimplificationSettings(item[0], item[1], item[2]));
        }
        mesh.simplify(settings);
        mesh.optimizeIndices(() => {
            console.log("优化网格")
        })
    }
}