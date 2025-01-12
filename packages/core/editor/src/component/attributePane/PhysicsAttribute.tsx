import {useSelectKey, useSelectObject3D, useViewer} from "../../store";
import {Fragment, useEffect, useMemo, useState} from "react";
import {useForceUpdate} from "../../hooks/useForceUpdate.ts";
import {Button, Form, FormProps} from "antd";
import {Mesh, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType} from "@babylonjs/core";
import {FieldData} from "rc-field-form/lib/interface";
import {InputNumberItem, ObjectAttributeProvider, SelectItem, TextItem} from "@plum-render/common-ui";
import EmptyState from "../Empty.tsx";
import {isExtendsTransformNode, isMesh} from "babylon-is";

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
export interface IProxyPhysicsBody {
    isEnable: string; // "未启用" 或其他状态
    mass: number; // 质量
    friction: number; // 摩擦系数
    restitution: number; // 反弹系数
    motionType: PhysicsMotionType; // 运动类型
    shapeType: PhysicsShapeType; // 形状类型
}
export default function PhysicsAttribute() {
    const viewer = useViewer()
    const selectObject3D = useSelectObject3D();

    const selectKey = useSelectKey();
    const [materialList, setMaterialList] = useState<any[]>([]);
    const [selectMaterial, setSelectMaterial] = useState<any>({})
    const [proxyPhysicsBody, setProxyPhysicsBody] = useState<IProxyPhysicsBody>({
        "isEnable": "未启用",
        "mass": 1,
        "friction": 0.2,
        "restitution": 0.75,
        "motionType": PhysicsMotionType.DYNAMIC,
        "shapeType": PhysicsShapeType.CONTAINER
    })
    const [isProxy, setIsProxy] = useState<boolean>(false)

    const [forceState, forceUpdate] = useForceUpdate();
    const [form] = Form.useForm();
    const physicsBody = useMemo(() => {
        if (isMesh(selectObject3D) && selectObject3D.physicsBody) {
            setIsProxy(false)
            return selectObject3D.physicsBody
        }
        setIsProxy(true)
        console.log("但会代理对象", proxyPhysicsBody)
        return proxyPhysicsBody;
    }, [selectObject3D, forceState, proxyPhysicsBody])

    useEffect(() => {
        if (isMesh(selectObject3D)) {
            const _physicsBody = selectObject3D.physicsBody;
            if (_physicsBody) {
                const massProperties = _physicsBody.getMassProperties();
                const mass = massProperties.mass;
                // form.setFieldsValue({mass: mass})
                const material = _physicsBody.shape?.material;
                if (material) {
                    const friction = material.friction;
                    const restitution = material.restitution;
                    const staticFriction = material.staticFriction;

                    // form.setFieldsValue({friction: friction})
                    // form.setFieldsValue({restitution: restitution})
                    // form.setFieldsValue({staticFriction: staticFriction})

                    setProxyPhysicsBody({
                        ...proxyPhysicsBody,
                        isEnable: "启用",
                        mass: mass,
                        friction: friction,
                        restitution: restitution,
                        staticFriction: staticFriction,
                    } as IProxyPhysicsBody)
                }
                let motionType = _convertPhysicsMotionTypeToString(_physicsBody.motionType);
                // form.setFieldsValue({motionType: motionType})
                if (_physicsBody.shape) {
                    let shapeType = _convertPhysicsShapeTypeToString(_physicsBody.shape.type);
                    // form.setFieldsValue({shapeType: shapeType})
                    setProxyPhysicsBody({
                        ...proxyPhysicsBody,
                        motionType: _physicsBody.motionType,
                        shapeType: _physicsBody.shape.type,
                    } as IProxyPhysicsBody)
                }
                // form.setFieldsValue({isEnable: "启用"})
            } else {
                // form.setFieldsValue({isEnable: "未启用"})
                setProxyPhysicsBody({
                    "isEnable": "未启用",
                    "mass": 1,
                    "friction": 0.2,
                    "restitution": 0.75,
                    "motionType": PhysicsMotionType.DYNAMIC,
                    "shapeType": PhysicsShapeType.CONVEX_HULL
                })
            }
        }
    }, [selectObject3D, forceState])

    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[], allFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name as Array<string>;
        const value = changedField.value === "null" ? null : changedField.value;
        const firstName = name[0] as string;
        console.log(`${name}: ${value}`)

        const material = (selectObject3D as unknown as Mesh)?.material;
        if (isMesh(selectObject3D) && viewer && material) {
            if (firstName === "mass") {
                selectObject3D.physicsBody!.setMassProperties({mass: value})
                return
            }
            // invoke(material, [...name, "fromHexString"], hex)
        }
    }


    const onCancelPhysics = () => {
        if (isExtendsTransformNode(selectObject3D)) {
            selectObject3D.reservedDataStore.physicsAggregate?.dispose();
            setProxyPhysicsBody({
                isEnable: "未启用",
                mass: form.getFieldValue("mass"),
                friction: form.getFieldValue("friction"),
                restitution: form.getFieldValue("restitution"),
                staticFriction: form.getFieldValue("staticFriction"),
                motionType: form.getFieldValue("motionType"),
                shapeType: form.getFieldValue("shapeType"),
            })
            forceUpdate();
        }
    }

    const onCreatePhysics = () => {
        if (isExtendsTransformNode(selectObject3D) && viewer) {
            const physicsAggregate = new PhysicsAggregate(selectObject3D, proxyPhysicsBody.shapeType, {...proxyPhysicsBody}, viewer.scene);
            selectObject3D.reservedDataStore.physicsAggregate = physicsAggregate
            forceUpdate();
        }
    }

    const RenderStateButton = () => {
        if (isProxy) {
            return <Form.Item label="状态">
                <Button color="default" variant="filled" onClick={onCreatePhysics}>
                    创建物理
                </Button>
            </Form.Item>
        } else {
            return <Form.Item label="状态">
                <Button color="default" variant="filled">
                    重置物理
                </Button>
                <Button color="default" variant="filled" onClick={onCancelPhysics}>
                    取消物理
                </Button>
            </Form.Item>
        }
    }

    const RenderMaterialList = () => {
        if (selectObject3D) {
            // if (physicsBody) {
            return <Form
                form={form}
                onFieldsChange={onFieldsChange}
                name="PhysicsAttribute"
                labelAlign="right"
                labelWrap={true}
                labelCol={{span: 8}}
                wrapperCol={{span: 16}}>
                <ObjectAttributeProvider
                    value={{object: proxyPhysicsBody, change: viewer?.editor.editorEventManager.selectMaterialChanged}}>
                    <TextItem name={["isEnable"]} label="开启" />

                    <InputNumberItem name={["mass"]} label="质量" />
                    <InputNumberItem name={["friction"]} label="动态摩擦" />
                    <InputNumberItem name={["restitution"]} label="恢复力" />
                    <InputNumberItem name={["staticFriction"]} label="静态摩擦" />

                    <SelectItem 
                                name="motionType"
                                label="运动类型"
                                fieldProps={{
                                    options: [
                                        {label: "动态", value: PhysicsMotionType.DYNAMIC},
                                        {label: "静态", value: PhysicsMotionType.STATIC},
                                        {label: "动画", value: PhysicsMotionType.ANIMATED},
                                    ]
                                }}
                    />
                    <SelectItem 
                                name="shapeType"
                                label="碰撞类型"
                                fieldProps={{
                                    options: [
                                        {label: "盒子", value: PhysicsShapeType.BOX},
                                        {label: "球体", value: PhysicsShapeType.SPHERE},
                                        {label: "圆柱体", value: PhysicsShapeType.CYLINDER},
                                        {label: "胶囊", value: PhysicsShapeType.CAPSULE},
                                        {label: "容器", value: PhysicsShapeType.CONTAINER},
                                        {label: "凸包", value: PhysicsShapeType.CONVEX_HULL},
                                        {label: "网格", value: PhysicsShapeType.MESH},
                                        {label: "高程图", value: PhysicsShapeType.HEIGHTFIELD},
                                    ]
                                }}
                    />
                    <RenderStateButton/>
                </ObjectAttributeProvider>
            </Form>
            // }
            // return <EmptyState text="当前对象没有材质"/>
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