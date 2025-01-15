import {Fragment, useEffect, useMemo, useState} from "react";
import {Collapse, CollapseProps, Descriptions, Form} from "antd";
import {DescriptionsProps} from "antd/lib";
import {
    BoolItem,
    ColorItem,
    InputNumberItem,
    NumberSliderItem,
    SelectItem,
    TextItem,
    Vector3Item
} from "@plum-render/common-ui";
import {useSelectObject3D, useViewer} from "../../../store";
import {isInstancedMesh, isMesh} from "babylon-is";
import {AbstractMesh, AnimationGroup, Mesh, RenderingManager, VertexBuffer} from "@babylonjs/core";
import {isArray, isNil} from "lodash-es";
import {PauseCircleOutlined, PlayCircleOutlined} from "@ant-design/icons";

export default function MeshAttribute() {
    const form = Form.useFormInstance();
    const viewer = useViewer()
    const [MeshInfo, setMeshInfo] = useState<DescriptionsProps['items']>([]);
    const selectObject3D = useSelectObject3D();
    useEffect(() => {
        if (selectObject3D) {
            update(selectObject3D)
        }
    }, [selectObject3D])
    const updateMeshInfo = (node: Mesh) => {
        if (!isMesh(node)) {
            return []
        }
        const items: DescriptionsProps['items'] = [
            {
                key: '0',
                label: 'Id',
                children: node.id
            },
            {
                key: '1',
                label: '类型',
                children: node.getClassName(),
            },
            {
                key: '2',
                label: '顶点数',
                children: node.getTotalVertices().toString()
            },
            {
                key: '3',
                label: '面数',
                children: (node.getTotalIndices() / 3).toFixed(0)
            },
            {
                key: '4',
                label: '子网格数',
                children: node.subMeshes ? node.subMeshes.length.toString() : "0"
            },
            {
                key: '5',
                label: '网格id',
                children: node.geometry?.uniqueId.toString()
            },

        ];
        setMeshInfo(items);
    }
    const getMeshAttributeFields = (node: Mesh) => {
        if (!isMesh(node)) {
            return []
        }
        let fields = [
            {
                name: "metadata",
                value: node.metadata
            },
            {
                name: "HasMatrixIndices",
                value: node.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) ? "Yes" : "No"
            },
            // todo 转为详细信息
            {
                name: "HasNormals",
                value: node.isVerticesDataPresent(VertexBuffer.NormalKind) ? "Yes" : "No"
            },
            {
                name: "HasVertexColors",
                value: node.isVerticesDataPresent(VertexBuffer.ColorKind) ? "Yes" : "No"
            },
            {
                name: "HasUVSet0",
                value: node.isVerticesDataPresent(VertexBuffer.UVKind) ? "Yes" : "No"
            },
            {
                name: "HasUVSet1",
                value: node.isVerticesDataPresent(VertexBuffer.UV2Kind) ? "Yes" : "No"
            },
            {
                name: "HasUVSet1",
                value: node.isVerticesDataPresent(VertexBuffer.UV2Kind) ? "Yes" : "No"
            },
            {
                name: "HasTangents",
                value: node.isVerticesDataPresent(VertexBuffer.TangentKind) ? "Yes" : "No"
            },
            {
                name: "HasMatrixWeights",
                value: node.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind) ? "Yes" : "No"
            },
            {
                name: "HasMatrixIndices",
                value: node.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) ? "Yes" : "No"
            },
        ]
        return fields;
    }
    const update = (value: any) => {
        updateMeshInfo(value)
        const fields = getMeshAttributeFields(value);
        form.setFields(fields)
        updateDebugFields(value)
    }

    const updateDebugFields = (mesh: AbstractMesh) => {
        if (!mesh.reservedDataStore) {
            mesh.reservedDataStore = {};
        }
        if (isNil(mesh.reservedDataStore.displayNormals)) {
            mesh.reservedDataStore.displayNormals = false;
        }
        if (isNil(mesh.reservedDataStore.displayVertexColors)) {
            mesh.reservedDataStore.displayVertexColors = false;
        }
        if (isNil(mesh.reservedDataStore.renderNormalVectors)) {
            mesh.reservedDataStore.renderNormalVectors = false;
        }
        if (isNil(mesh.reservedDataStore.renderWireframeOver)) {
            mesh.reservedDataStore.renderWireframeOver = false;
        }
        console.log(mesh.reservedDataStore)
        form.setFieldValue(["reservedDataStore", "displayNormals"], mesh.reservedDataStore.displayNormals)
        form.setFieldValue(["reservedDataStore", "displayVertexColors"], mesh.reservedDataStore.displayVertexColors)
        form.setFieldValue(["reservedDataStore", "renderNormalVectors"], mesh.reservedDataStore.renderNormalVectors)
        form.setFieldValue(["reservedDataStore", "renderWireframeOver"], mesh.reservedDataStore.renderWireframeOver)
        // const fields = getMeshAttributeFields(value);
        // form.setFields(fields)
    }

    const items = useMemo(() => {
        const list: CollapseProps['items'] = [];
        list.push({
            key: '变换',
            label: '变换',
            children: <Fragment>
                <Vector3Item basePropertyName={["position"]} label="位置"/>
                <Vector3Item basePropertyName={["rotation"]} label="旋转" isQuaternion/>
                <Vector3Item basePropertyName={["scaling"]} label="缩放"/>
            </Fragment>
        });

        list.push({
            key: '显示',
            label: '显示',
            children: <Fragment>
                <NumberSliderItem name={["visibility"]} label="透明度" min={0} max={1} step={0.01}/>
                <SelectItem
                    name={["sideOrientation"]}
                    label="顶点顺序"
                    fieldProps={{
                        options: [
                            {value: Mesh.FRONTSIDE, label: "正面"},
                            {value: Mesh.BACKSIDE, label: '背面'},
                            {value: Mesh.DOUBLESIDE, label: '双面'},
                        ]
                    }}
                />
                <InputNumberItem name={["alphaIndex"]} label="透明排序"/>
                <BoolItem name={["receiveShadows"]} label="是否接收阴影"/>

                <NumberSliderItem name={["renderingGroupId"]} label="渲染组" step={1}
                                  min={RenderingManager.MIN_RENDERINGGROUPS}
                                  max={RenderingManager.MAX_RENDERINGGROUPS - 1}/>
                <InputNumberItem name={["layerMask"]} label="渲染层级"/>
            </Fragment>
        });

        list.push({
            key: '遮挡',
            label: '遮挡',
            children: <Fragment>
                <SelectItem
                    name={["occlusionType"]}
                    label="遮挡类型"
                    fieldProps={{
                        options: [
                            {label: "无", value: AbstractMesh.OCCLUSION_TYPE_NONE},
                            {label: "乐观", value: AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC},
                            {label: "严谨", value: AbstractMesh.OCCLUSION_TYPE_STRICT},
                        ]
                    }}
                />
                <InputNumberItem name={["occlusionRetryCount"]} label="重试次数"/>
                <SelectItem
                    name={["occlusionQueryAlgorithmType"]}
                    label="查询算法"
                    fieldProps={{
                        options: [
                            {label: "准确", value: AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE},
                            {label: "保守", value: AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE},
                        ]
                    }}
                />
            </Fragment>
        });

        // todo 少东西
        list.push({
            key: '高级',
            label: '高级',
            children: <Fragment>
                <BoolItem name={["checkCollisions"]} label="是否碰撞"/>
            </Fragment>
        });

        list.push({
            key: '边缘渲染',
            label: '边缘渲染',
            children: <Fragment>
                <BoolItem name={["edgesRenderer"]} label="边缘渲染"/>
                <NumberSliderItem name={["edgesWidth"]} label="边缘宽度" min={0} max={10} step={0.1}/>
                <ColorItem name={["edgesColor"]} label="边缘颜色" convertData={(value) => {
                    return value.toHexString();
                }}/>
            </Fragment>
        });

        list.push({
            key: '轮廓/叠加',
            label: '轮廓/叠加',
            children: <Fragment>
                <BoolItem name={["renderOverlay"]} label="渲染覆盖层"/>
                <ColorItem name={["overlayColor"]} label="覆盖层颜色" convertData={(value) => {
                    return value.toHexString();
                }}/>

                <BoolItem name={["renderOutline"]} label="是否渲染轮廓"/>
                <ColorItem name={["outlineColor"]} label="轮廓颜色" convertData={(value) => {
                    return value.toHexString();
                }}/>
                <InputNumberItem name={["outlineWidth"]} label="轮廓宽度"/>
            </Fragment>
        });

        list.push({
            key: '调试',
            label: '调试',
            children: <Fragment>
                <BoolItem name={["reservedDataStore", "displayNormals"]} label="显示法线" virtual/>
                <BoolItem name={["reservedDataStore", "displayVertexColors"]} label="显示顶点颜色" virtual/>
                <BoolItem name={["reservedDataStore", "renderNormalVectors"]} label="显示顶点法线" virtual/>
                <BoolItem name={["reservedDataStore", "renderWireframeOver"]} label="渲染线框" virtual/>
            </Fragment>
        });

        return list;
    }, [selectObject3D]);

    return (
        <Fragment>
            <BoolItem label="是否启用" name={["isEnabled"]}/>
            <BoolItem label="是否锁定" name={["isPickable"]}/>
            <InputNumberItem label="网格id" name={["geometryUniqueId"]}/>
            {isInstancedMesh(selectObject3D) && <TextItem label="实例源" name={["sourceMesh", "name"]}/>}
            <Collapse items={[...items]} bordered={false} ghost defaultActiveKey={['变换']}/>
            {/*<JsonItem itemProps={{label: "自定义数据", name: "metadata"}}/>*/}
            <Descriptions title="统计信息" items={MeshInfo}/>
        </Fragment>
    )
}

