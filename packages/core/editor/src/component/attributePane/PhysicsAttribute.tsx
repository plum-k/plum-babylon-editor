import {useSelectKey, useSelectObject3D, useViewer} from "../../store";
import {Fragment, useEffect, useMemo, useState} from "react";
import {useForceUpdate} from "../../hooks/useForceUpdate.ts";
import {Button, CollapseProps, Form, FormProps} from "antd";
import {Constants, Engine, Material, Mesh, PBRMaterial, PhysicsMotionType, PhysicsShapeType} from "@babylonjs/core";
import {FieldData} from "rc-field-form/lib/interface";
import {
    BoolItem,
    InputNumberItem,
    NumberSliderItem,
    ObjectAttributeProvider,
    SelectItem,
    TextItem
} from "@plum-render/common-ui";
import EmptyState from "../Empty.tsx";
import {isMesh} from "babylon-is";

export function _convertPhysicsMotionTypeToString(type?: PhysicsMotionType) {
    switch (type) {
        case PhysicsMotionType.DYNAMIC:
            return "动态";
        case PhysicsMotionType.STATIC:
            return "静态";
        case PhysicsMotionType.ANIMATED:
            return "动画";
        default:
            return "Unknown";
    }
}

export function _convertPhysicsShapeTypeToString(type?: PhysicsShapeType) {
    switch (type) {
        case PhysicsShapeType.BOX:
            return "盒子";
        case PhysicsShapeType.SPHERE:
            return "球体";
        case PhysicsShapeType.CYLINDER:
            return "圆柱体";
        case PhysicsShapeType.CAPSULE:
            return "胶囊";
        case PhysicsShapeType.CONTAINER:
            return "容器";
        case PhysicsShapeType.CONVEX_HULL:
            return "凸包";
        case PhysicsShapeType.MESH:
            return "网格";
        case PhysicsShapeType.HEIGHTFIELD:
            return "高程图";
        default:
            return "未知";
    }
}

export default function PhysicsAttribute() {

    const viewer = useViewer()
    const selectObject3D = useSelectObject3D();
    const selectKey = useSelectKey();
    const [materialList, setMaterialList] = useState<any[]>([]);
    const [selectMaterial, setSelectMaterial] = useState<any>({})

    const [forceState, forceUpdate] = useForceUpdate();

    const [form] = Form.useForm();
    const physicsBody = useMemo(() => {
        if (isMesh(selectObject3D)) {
            return selectObject3D.physicsBody
        }
        return null
    }, [selectObject3D])

    useEffect(() => {
        if (isMesh(selectObject3D)) {
            const _physicsBody = selectObject3D.physicsBody;
            if (_physicsBody) {
                const massProperties = _physicsBody.getMassProperties();
                const mass = massProperties.mass;
                form.setFieldsValue({mass: mass})
                const material = _physicsBody.shape?.material;
                console.log(material)
                if (material) {
                    const friction = material.friction;
                    const restitution = material.restitution;
                    const staticFriction = material.staticFriction;
                    form.setFieldsValue({friction: friction})
                    form.setFieldsValue({restitution: restitution})
                    form.setFieldsValue({staticFriction: staticFriction})
                }
                let motionType = _convertPhysicsMotionTypeToString(_physicsBody.motionType);
                form.setFieldsValue({motionType: motionType})

                if (_physicsBody.shape) {
                    let shapeType = _convertPhysicsShapeTypeToString(_physicsBody.shape.type);
                    form.setFieldsValue({shapeType: shapeType})
                }
                form.setFieldsValue({isEnable: "启用"})
            } else {
                form.setFieldsValue({isEnable: "未启用"})
            }
        }
    }, [selectObject3D])

    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[], allFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name as Array<string>;
        const value = changedField.value === "null" ? null : changedField.value;
        const firstName = name[0] as string;
        console.log(`${name}: ${value}`)

        const material = (selectObject3D as unknown as Mesh)?.material;
        if (isMesh(selectObject3D) && viewer && material) {
            // 如果是名称，只在失去交点时设置
            if (firstName === "mass") {
                selectObject3D.physicsBody!.setMassProperties({mass: value})
                return
            }
            // invoke(material, [...name, "fromHexString"], hex)
        }
    }

    const RenderStateButton = () => {
        if (physicsBody) {
            return <Form.Item label="状态">
                <Button color="default" variant="filled">
                    重置物理
                </Button>
                <Button color="default" variant="filled">
                    取消物理
                </Button>
            </Form.Item>
        } else {
            return <Form.Item label="状态">
                <Button color="default" variant="filled">
                    创建物理
                </Button>
            </Form.Item>
        }
    }

    const RenderMaterialList = () => {
        if (selectObject3D) {
            if (physicsBody) {
                return <Form
                    form={form}
                    onFieldsChange={onFieldsChange}
                    name="PhysicsAttribute"
                    labelAlign="right"
                    labelWrap={true}
                    labelCol={{span: 8}}
                    wrapperCol={{span: 16}}>
                    <ObjectAttributeProvider
                        value={{object: physicsBody, change: viewer?.editor.editorEventManager.selectMaterialChanged}}>
                        <TextItem name={["isEnable"]} label="开启" virtual/>

                        <InputNumberItem name={["mass"]} label="质量" virtual/>
                        <InputNumberItem name={["friction"]} label="动态摩擦" virtual/>
                        <InputNumberItem name={["restitution"]} label="恢复力" virtual/>
                        <InputNumberItem name={["staticFriction"]} label="静态摩擦" virtual/>

                        <SelectItem virtual
                            name="motionType"
                            label="运动类型"
                            fieldProps={{
                                options: [
                                    { label: "动态", value: PhysicsMotionType.DYNAMIC },
                                    { label: "静态", value: PhysicsMotionType.STATIC },
                                    { label: "动画", value: PhysicsMotionType.ANIMATED },
                                ]
                            }}
                        />
                        <SelectItem virtual
                            name="shapeType"
                            label="碰撞类型"
                            fieldProps={{
                                options: [
                                    { label: "盒子", value: PhysicsShapeType.BOX },
                                    { label: "球体", value: PhysicsShapeType.SPHERE },
                                    { label: "圆柱体", value: PhysicsShapeType.CYLINDER },
                                    { label: "胶囊", value: PhysicsShapeType.CAPSULE },
                                    { label: "容器", value: PhysicsShapeType.CONTAINER },
                                    { label: "凸包", value: PhysicsShapeType.CONVEX_HULL },
                                    { label: "网格", value: PhysicsShapeType.MESH },
                                    { label: "高程图", value: PhysicsShapeType.HEIGHTFIELD },
                                ]
                            }}
                        />
                        <RenderStateButton/>
                    </ObjectAttributeProvider>
                </Form>
            }
            return <EmptyState text="当前对象没有材质"/>
        } else {
            return <EmptyState text="未选择对象"/>
        }
    }

    return (
        <Fragment>
            <RenderMaterialList/>
        </Fragment>
    )
}