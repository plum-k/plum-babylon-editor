import {FC, Fragment, useEffect, useMemo} from "react";
import {Collapse, Form, FormProps} from "antd";
import {FieldData} from "rc-field-form/lib/interface";
import {
    AttributeImage,
    BoolItem,
    ColorItem,
    InputNumberItem,
    ObjectAttributeProvider,
    SelectItem
} from "@plum-render/common-ui";
import {useViewer} from "../../store";
import {invoke, set} from "lodash-es";
import {HDRCubeTextureAssetTask, Scene} from "@babylonjs/core";
import {isAggregationColor} from "../../tool/isAggregationColor.ts";
import type {ItemType} from "rc-collapse/es/interface";

const SceneAttribute: FC = () => {
    const [form] = Form.useForm();
    const viewer = useViewer()
    const fogMode = Form.useWatch('fogMode', form);

    useEffect(() => {
        if (viewer?.scene) {
            updateRenderMode();

            viewer?.assetsManager.onTaskSuccessObservable.add((task) => {
                if (task instanceof HDRCubeTextureAssetTask) {
                    let skybox = form.getFieldValue("skybox") as boolean;
                    // 天空盒 同步 环境贴图
                    if (skybox) {
                        viewer.skybox = viewer!.scene.createDefaultSkybox(task.texture, true, (viewer.scene.activeCamera!.maxZ - viewer.scene.activeCamera!.minZ) / 2, 0.3, false)
                    }
                }
            })
        }
    }, [viewer])

    // 设置渲染状态
    const updateRenderMode = () => {
        if (viewer?.scene) {
            if (viewer.scene.forceWireframe) {
                form.setFieldValue("renderMode", "线框")
            } else if (viewer.scene.forcePointsCloud) {
                form.setFieldValue("renderMode", "点云")
            } else {
                form.setFieldValue("renderMode", "无")
            }
            form.setFieldValue("skybox", false)
        }
    }

    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name;
        const value = changedField.value;
        const firstName = name[0] as string;
        if (name === "renderMode") {
            if (value === "线框") {
                set(viewer!.scene, "forceWireframe", true);
            } else if (value === "点云") {
                set(viewer!.scene, "forcePointsCloud", true);
            } else {
                set(viewer!.scene, "forcePointsCloud", false);
                set(viewer!.scene, "forceWireframe", false);
            }
        } else if (isAggregationColor(value)) {
            let hex = value.toHexString();
            invoke(viewer!.scene, [...names, "fromHexString"], hex)
        } else if (name === "skybox") {
            if (value) {
                if (viewer!.scene.environmentTexture) {
                    viewer.skybox = viewer!.scene.createDefaultSkybox(viewer!.scene.environmentTexture, true, (viewer.scene.activeCamera!.maxZ - viewer.scene.activeCamera!.minZ) / 2, 0.3, false)
                }
            } else {
                if (viewer.skybox) {
                    viewer!.scene.removeMesh(viewer.skybox);
                    viewer.skybox.dispose()
                    viewer.skybox = null
                }
            }
        } else {
            set(viewer!.scene, name, value)
        }
    }

    const envItem = useMemo<ItemType>(() => {
        return {
            key: '环境',
            label: '环境',
            children: <Fragment>
                <ColorItem label="清除颜色" name={["clearColor"]}/>
                <BoolItem label="自动清除" name={["autoClear"]}/>
                <ColorItem label="环境色" name={["ambientColor"]}/>
                <Form.Item label="环境贴图" name={"environmentTexture"}>
                    <AttributeImage/>
                </Form.Item>
                <InputNumberItem label="环境强度" name={["environmentIntensity"]}/>
            </Fragment>
        }
    }, [viewer, fogMode])

    const fogItem = useMemo<ItemType>(() => {
        return {
            key: '雾',
            label: '雾',
            children: <Fragment>
                <SelectItem label="雾模式" name={["fogMode"]} fieldProps={{
                    options: [
                        {label: "无", value: Scene.FOGMODE_NONE},
                        {label: "线性雾", value: Scene.FOGMODE_LINEAR},
                        {label: "指数雾", value: Scene.FOGMODE_EXP},
                        {label: "指数雾2", value: Scene.FOGMODE_EXP2},
                    ]
                }}/>
                {
                    viewer?.scene.fogMode !== Scene.FOGMODE_NONE &&
                    <Fragment>
                        <ColorItem label="雾颜色" name={["fogColor"]}/>
                        {
                            viewer?.scene.fogMode === Scene.FOGMODE_LINEAR &&
                            <Fragment>
                                <InputNumberItem label="雾开始" name={["fogStart"]}/>
                                <InputNumberItem label="雾结束" name={["fogEnd"]}/>
                            </Fragment>
                        }
                        {
                            viewer?.scene.fogMode !== Scene.FOGMODE_LINEAR &&
                            <InputNumberItem label="雾密度" name={["fogDensity"]}/>
                        }
                    </Fragment>
                }
            </Fragment>
        }
    }, [viewer, fogMode])

    return (
        <Fragment>
            <div className={"scrollable-div"}>
                <Form
                    form={form}
                    onFieldsChange={onFieldsChange}
                    name="SceneAttribute"
                    labelAlign="right"
                    labelWrap={true}
                    labelCol={{span: 8}}
                    wrapperCol={{span: 16}}>
                    <ObjectAttributeProvider value={{object: viewer!.scene}}>
                        <SelectItem virtual label="渲染模式" name={["renderMode"]} fieldProps={{
                            options: [
                                {label: "无", value: "无"},
                                {label: "线框", value: "线框"},
                                {label: "点云", value: "点云"}]
                        }}/>
                        <BoolItem label="天空盒" name={["skybox"]} virtual/>
                        <Collapse items={[envItem, fogItem]} bordered={false} ghost defaultActiveKey={['环境', "雾"]}/>
                    </ObjectAttributeProvider>
                </Form>
            </div>
        </Fragment>
    )
}

export default SceneAttribute;
