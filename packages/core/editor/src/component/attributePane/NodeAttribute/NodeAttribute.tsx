import {Fragment, useEffect, useState} from "react";
import {Form, FormProps} from "antd";
import {useSelectObject3D, useViewer} from "../../../store";
import {InputItem, ObjectAttributeProvider, TextItem} from "../../../common-ui";
import {AbstractMesh, ArcRotateCamera, HemisphericLight, Node, Tools, Vector3} from "@babylonjs/core";
import {
    fromBabylonObservable,
    isArcRotateCamera,
    isCamera,
    isDirectionalLight,
    isFollowCamera,
    isFreeCamera,
    isHemisphericLight,
    isInstancedMesh,
    isMesh,
    isPlumArcRotateCamera,
    isPointLight,
    isSpotLight,
    isTransformNode,
    NodeTool
} from "@plum-render/babylon-sdk";
import {auditTime} from "rxjs";
import {get, invoke} from "lodash-es";
import {isAggregationColor} from "../../../tool/isAggregationColor.ts";
import {MeshAttribute} from "./MeshAttribute.tsx";
import {TransformNodeAttribute} from "./TransformNodeAttribute.tsx";
import {ArcRotateCameraAttribute} from "./ArcRotateCameraAttribute.tsx";
import {FollowCameraAttribute} from "./FollowCameraAttribute.tsx";
import {FreeCameraAttribute} from "./FreeCameraAttribute.tsx";
import {DirectionalLightAttribute, HemisphericLightAttribute, PointLightAttribute, SpotLightAttribute} from "./lights";
import {EmptyState} from "../../Empty.tsx";


export function NodeAttribute() {
    const viewer = useViewer()
    const [form] = Form.useForm();
    const selectObject3D = useSelectObject3D();
    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields, allFields) => {
        const changedField = changedFields[0];
        const name = changedField.name as Array<string>;
        const value = changedField.value;
        const firstName = name[0] as string;
        console.log(name, value)
        // 输入框为空，不处理
        if (value === null) {
            return
        }
        // 如果是名称，只在失去交点时设置
        if (firstName === "name") {
            return
        }
        if (selectObject3D && viewer) {
            if (firstName === "isEnabled") {
                selectObject3D?.setEnabled(value);
                return;
            }

            const isSet = onFieldsChangeMesh(name, value);
            if (isSet) {
                return;
            }

            const isSetLight = onFieldsChangeLight(name, value);
            if (isSetLight) {
                return;
            }

            if (isAggregationColor(value)) {
                let hex = value.toHexString();
                invoke(selectObject3D, [...name, "fromHexString"], hex)
            } else {
                viewer.editor.setObjectValueExecute({
                    source: "Form",
                    object: selectObject3D,
                    attributePath: name,
                    newValue: value,
                })
                // viewer?.editor.setValueExecute(selectObject3D, names, value);
                console.log("11111111")
                // set(selectObject3D, names, value)
            }
        }
    }

    /// 同步 isEnabled isPickable 的状态
    const syncIsEnabledAndIsPickable = (node: Node) => {
        form.setFieldValue("isEnabled", node.isEnabled())
    }
    // 处理光源属性变换
    const onFieldsChangeLight = (name: Array<string>, value: any) => {
        const _selectObject3D = selectObject3D as unknown as HemisphericLight;
        let isSet = false;
        if (name[0] === "direction") {
            const oldValue = _selectObject3D.direction.clone();
            const newValue = oldValue.clone();
            if (name[1] === "x") {
                newValue.x = Tools.ToRadians(value);
            } else if (name[1] === "y") {
                newValue.y = Tools.ToRadians(value);
            } else if (name[1] === "z") {
                newValue.z = Tools.ToRadians(value);
            }
            viewer?.editor.setScaleExecute({
                source: "Form",
                object: _selectObject3D,
                attributePath: ['direction'],
                newValue: newValue,
                oldValue: oldValue
            })
            isSet = true;

        }
        return isSet;
    }
    // 处理网格属性变换
    const onFieldsChangeMesh = (name: Array<string>, value: any) => {
        const _selectObject3D = selectObject3D as unknown as AbstractMesh;
        let isSet = false;
        if (name[0] === "position") {
            const oldPosition = _selectObject3D.position.clone();
            const newPosition = oldPosition.clone();
            if (name[1] === "x") {
                newPosition.x = value;
            } else if (name[1] === "y") {
                newPosition.y = value;
            } else if (name[1] === "z") {
                newPosition.z = value;
            }
            viewer?.editor.setPositionExecute({
                source: "Form",
                object: _selectObject3D,
                attributePath: ['position'],
                newValue: newPosition,
                oldValue: oldPosition
            })
            isSet = true;
        } else if (name[0] === "rotation") {
            console.log("_selectObject3D.rotationQuaternion", _selectObject3D.rotationQuaternion)
            const oldQuaternion = _selectObject3D.rotationQuaternion!.clone();
            const x = form.getFieldValue(["rotation", "x"]);
            const y = form.getFieldValue(["rotation", "y"]);
            const z = form.getFieldValue(["rotation", "z"]);
            const v3 = new Vector3(
                Tools.ToRadians(x),
                Tools.ToRadians(y),
                Tools.ToRadians(z)
            );
            const newQuaternion = v3.toQuaternion();
            viewer?.editor.setObjectQuaternionCommand({
                source: "Form",
                object: _selectObject3D,
                attributePath: ['rotationQuaternion'],
                newValue: newQuaternion,
                oldValue: oldQuaternion
            })
            isSet = true;
        } else if (name[0] === "scale") {
            const oldScale = _selectObject3D.scaling.clone();
            const newScale = oldScale.clone();
            if (name[1] === "x") {
                newScale.x = value;
            } else if (name[1] === "y") {
                newScale.y = value;
            } else if (name[1] === "z") {
                newScale.z = value;
            }
            viewer?.editor.setScaleExecute({
                source: "Form",
                object: _selectObject3D,
                attributePath: ['rotation'],
                newValue: newScale,
                oldValue: oldScale
            })
            isSet = true;
        } else if (name[0] === "reservedDataStore") {
            if (name[1] === "displayNormals") {
                if (value) {
                    NodeTool.displayNormals(_selectObject3D)
                    form.setFieldValue(["reservedDataStore", "displayVertexColors"], false)
                } else {
                    NodeTool.displayNormals(_selectObject3D)
                }
            } else if (name[1] === "displayVertexColors") {
                if (value) {
                    NodeTool.displayVertexColors(_selectObject3D)
                    form.setFieldValue(["reservedDataStore", "displayNormals"], false)
                } else {
                    NodeTool.displayVertexColors(_selectObject3D)
                }
            } else if (name[1] === "renderNormalVectors") {
                if (value) {
                    NodeTool.renderNormalVectors(_selectObject3D)
                } else {
                    NodeTool.renderNormalVectors(_selectObject3D)
                }
            } else if (name[1] === "renderWireframeOver") {
                if (value) {
                    NodeTool.renderWireframeOver(_selectObject3D)
                } else {
                    NodeTool.renderWireframeOver(_selectObject3D)
                }
            }
            isSet = true;
        } else if (name[0] === "edgesRenderer") {
            if (value) {
                _selectObject3D.enableEdgesRendering();
            } else {
                _selectObject3D.disableEdgesRendering();
            }
            isSet = true;
        }
        return isSet;
    }

    const RenderAttribute = () => {
        if (isInstancedMesh(selectObject3D)) {
            return <MeshAttribute/>
        } else if (isTransformNode(selectObject3D)) {
            return <TransformNodeAttribute/>
        } else if (isArcRotateCamera(selectObject3D) || isPlumArcRotateCamera(selectObject3D)) {
            return <ArcRotateCameraAttribute/>
        } else if (isFollowCamera(selectObject3D)) {
            return <FollowCameraAttribute/>
        } else if (isFreeCamera(selectObject3D)) {
            return <FreeCameraAttribute/>
        } else if (isMesh(selectObject3D)) {
            if (selectObject3D.getTotalVertices() > 0) {
                return <MeshAttribute/>
            } else {
                return <TransformNodeAttribute/>
            }
        } else if (isDirectionalLight(selectObject3D)) {
            return <DirectionalLightAttribute/>
        } else if (isSpotLight(selectObject3D)) {
            return <SpotLightAttribute/>
        } else if (isHemisphericLight(selectObject3D)) {
            return <HemisphericLightAttribute/>
        } else if (isPointLight(selectObject3D)) {
            return <PointLightAttribute/>
        }
        return <Fragment></Fragment>
    }


    // 当选择对象是相机时, 操作场景也会更新相机的值
    useEffect(() => {
        if (viewer && selectObject3D) {
            syncIsEnabledAndIsPickable(selectObject3D);
            if (isCamera(selectObject3D)) {
                const camera = selectObject3D as ArcRotateCamera;

                const viewMatrixChangedObservable = fromBabylonObservable(camera.onViewMatrixChangedObservable)

                const subscribe = viewMatrixChangedObservable.pipe(auditTime(200)).subscribe(() => {
                    viewer?.editor.editorEventManager.selectObjectChanged.next({
                        source: "Editor",
                        object: camera,
                        attributePath: []
                    })
                })
                return () => {
                    subscribe.unsubscribe()
                }
            }
        }
    }, [viewer, selectObject3D])

    const [initName, setInitName] = useState<string>('')

    return (
        <Fragment>
            {
                selectObject3D ? <Form
                        onFieldsChange={onFieldsChange}
                        form={form}
                        name="Attribute"
                        labelAlign="right"
                        labelCol={{span: 6}}>
                        <ObjectAttributeProvider
                            value={{
                                object: selectObject3D,
                                change: viewer?.editor.editorEventManager.selectObjectChanged
                            }}>
                            <TextItem name={["id"]} label={["id"]}/>
                            <TextItem name={["uniqueId"]} label="唯一标识"/>
                            <TextItem funName={"getClassName"} label="类型" virtual valueSource={"fun"}/>
                            <InputItem name={["name"]} label="名称"
                                       fieldProps={{
                                           onFocus: () => {
                                               setInitName(get(selectObject3D, "name"))
                                           },
                                           onBlur: (e) => {
                                               console.log()
                                               viewer?.editor.setObjectValueExecute({
                                                   source: "Form",
                                                   object: selectObject3D,
                                                   attributePath: ["name"],
                                                   oldValue: initName,
                                                   newValue: e.target.value,
                                               })
                                               viewer?.editor.editorEventManager.sceneGraphChanged.next(true)
                                           }
                                       }}
                            />
                            <RenderAttribute/>
                        </ObjectAttributeProvider>
                    </Form> :
                    <EmptyState text="未选择对象"/>
            }
        </Fragment>
    )
}

