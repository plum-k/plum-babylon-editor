import {
    AbstractMesh,
    Color3,
    CreateLineSystem,
    Node,
    StandardMaterial,
    TmpVectors,
    Vector3,
    VertexBuffer
} from "@babylonjs/core";
import {isAbstractMesh, isCamera, isLight, isMesh} from "../guard";
import {NormalMaterial} from "@babylonjs/materials";

export class NodeTool {
    /**
     * 切换节点的可见性
     * @param node 节点
     * @param recursive 是否递归切换子节点的可见性
     */
    static toggleVisibility(node: Node, recursive = false) {
        if (isAbstractMesh(node)) {
            node.isVisible = !node.isVisible;
        } else if (isCamera(node)) {
            node.setEnabled(!node.isEnabled());
        } else if (isLight(node)) {
            console.log(node.isEnabled())
            node.setEnabled(!node.isEnabled());
        }
        if (recursive) {
            node.getChildMeshes().forEach((m) => {
                NodeTool.toggleVisibility(m);
            });
        }
    }

    /**
     * 设置节点的可见性
     * @param node 节点
     * @param visible 是否可见
     * @param recursive 是否递归设置子节点的可见性
     */
    static visibleNode(node: Node, visible: boolean = true, recursive = false) {
        if (isAbstractMesh(node)) {
            node.isVisible = visible;
        } else if (isCamera(node)) {
            node.setEnabled(visible);
        } else if (isLight(node)) {
            node.setEnabled(visible);
        }
        if (recursive) {
            node.getChildMeshes().forEach((m) => {
                NodeTool.visibleNode(m);
            });
        }
    }

    /**
     * 获取节点的可见性
     * @param node 节点
     */
    static getVisibleNode(node: Node) {
        if (isMesh(node)) {
            return node.isVisible
        } else if (isCamera(node)) {
            return node.isEnabled();
        } else if (isLight(node)) {
            return node.isEnabled();
        }
        return false;
    }

    /**
     * 显示法线
     * @param mesh 模型
     */
    static displayNormals(mesh: AbstractMesh) {
        const scene = mesh.getScene();
        if (mesh.material && mesh.material.getClassName() === "NormalMaterial") {
            // mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            // mesh.reservedDataStore.originalMaterial = null;
        } else {
            if (typeof NormalMaterial === "undefined") {
                return;
            }

            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }

            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }
            const normalMaterial = new NormalMaterial("normalMaterial", scene);
            normalMaterial.disableLighting = true;
            if (mesh.material) {
                normalMaterial.sideOrientation = mesh.material.sideOrientation;
            }
            normalMaterial.reservedDataStore = {hidden: true};
            mesh.material = normalMaterial;
        }
    }

    /**
     * 显示顶点颜色
     * @param mesh 模型
     */
    static displayVertexColors(mesh: AbstractMesh) {
        const scene = mesh.getScene();

        if (mesh.material && mesh.material.reservedDataStore && mesh.material.reservedDataStore.isVertexColorMaterial) {
            mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
        } else {
            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }
            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }
            const vertexColorMaterial = new StandardMaterial("vertex colors", scene);
            vertexColorMaterial.disableLighting = true;
            vertexColorMaterial.emissiveColor = Color3.White();
            if (mesh.material) {
                vertexColorMaterial.sideOrientation = mesh.material.sideOrientation;
            }
            vertexColorMaterial.reservedDataStore = {hidden: true, isVertexColorMaterial: true};
            mesh.useVertexColors = true;
            mesh.material = vertexColorMaterial;
        }
    }

    /**
     * 渲染顶点法线
     * @param mesh 模型
     */
    static renderNormalVectors(mesh: AbstractMesh) {
        const scene = mesh.getScene();

        if (mesh.reservedDataStore && mesh.reservedDataStore.normalLines) {
            mesh.reservedDataStore.normalLines.dispose();
            mesh.reservedDataStore.normalLines = null;

            return;
        }

        const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        const color = Color3.White();
        const bbox = mesh.getBoundingInfo();
        const diag = bbox.maximum.subtractToRef(bbox.minimum, TmpVectors.Vector3[0]);
        const size = diag.length() * 0.05;

        const lines = [];
        for (let i = 0; i < normals!.length; i += 3) {
            const v1 = Vector3.FromArray(positions!, i);
            const v2 = v1.add(Vector3.FromArray(normals!, i).scaleInPlace(size));
            lines.push([v1, v2]);
        }

        const normalLines = CreateLineSystem("normalLines", {lines: lines}, scene);
        normalLines.color = color;
        normalLines.parent = mesh;
        normalLines.reservedDataStore = {hidden: true};

        if (!mesh.reservedDataStore) {
            mesh.reservedDataStore = {};
        }

        mesh.reservedDataStore.normalLines = normalLines;
    }

    /**
     * 渲染网格线条
     * @param mesh 模型
     */
    static renderWireframeOver(mesh: AbstractMesh) {
        const scene = mesh.getScene();

        if (mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver) {
            mesh.reservedDataStore.wireframeOver.dispose(false, true);
            mesh.reservedDataStore.wireframeOver = null;

            return;
        }

        const wireframeOver = mesh.clone(mesh.name + "_wireframeover", null, true)!;
        wireframeOver.reservedDataStore = {hidden: true};

        // Sets up the mesh to be attached to the parent.
        // So all neutral in local space.
        wireframeOver.parent = mesh;
        wireframeOver.position = Vector3.Zero();
        wireframeOver.scaling = new Vector3(1, 1, 1);
        wireframeOver.rotation = Vector3.Zero();
        wireframeOver.rotationQuaternion = null;

        const material = new StandardMaterial("wireframeOver", scene);
        material.reservedDataStore = {hidden: true};
        wireframeOver.material = material;
        material.disableLighting = true;
        material.backFaceCulling = false;
        material.emissiveColor = Color3.White();

        material.wireframe = true;

        if (!mesh.reservedDataStore) {
            mesh.reservedDataStore = {};
        }

        mesh.reservedDataStore.wireframeOver = wireframeOver;
    }
}
