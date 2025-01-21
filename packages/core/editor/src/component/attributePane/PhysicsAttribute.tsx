import {useSelectObject3D, useViewer} from "../../store";
import {Fragment, useEffect, useState} from "react";
import {Button, Form, FormProps, Space} from "antd";
import {PhysicsAggregate, PhysicsMotionType, PhysicsShapeType} from "@babylonjs/core";
import {FieldData} from "rc-field-form/lib/interface";
import {InputNumberItem, ObjectAttributeProvider, SelectItem, TextItem} from "../../common-ui";
import {isExtendsTransformNode, isMesh} from "@plum-render/babylon-sdk";
import {set} from "lodash-es";
import {useForceUpdate} from "../../hooks/useForceUpdate.ts";
import {EmptyState} from "../Empty.tsx";

export interface IProxyPhysicsBody {
    isEnable: string; // "未启用" 或其他状态
    mass: number; // 质量
    friction: number; // 摩擦系数
    staticFriction: number;
    restitution: number; // 反弹系数
    motionType: PhysicsMotionType; // 运动类型
    shapeType: PhysicsShapeType; // 形状类型
}

export function PhysicsAttribute() {
    const viewer = useViewer()
    const selectObject3D = useSelectObject3D();
    const [proxyPhysicsBody, setProxyPhysicsBody] = useState<IProxyPhysicsBody>({
        isEnable: "未启用",
        mass: 1,
        friction: 0.2,
        restitution: 0.75,
        staticFriction: 0,
        motionType: PhysicsMotionType.DYNAMIC,
        shapeType: PhysicsShapeType.SPHERE
    })
    const [forceState, forceUpdate] = useForceUpdate();
    const [form] = Form.useForm();

    useEffect(() => {
        if (isMesh(selectObject3D)) {
            const _physicsBody = selectObject3D.physicsBody;
            if (_physicsBody) {
                const massProperties = _physicsBody.getMassProperties();
                const mass = massProperties.mass;
                const material = _physicsBody.shape?.material;
                if (material) {
                    const friction = material.friction || 0;
                    const restitution = material.restitution || 0;
                    const staticFriction = material.staticFriction || 0;
                    setProxyPhysicsBody({
                        ...proxyPhysicsBody,
                        isEnable: "启用",
                        mass: mass,
                        friction: friction,
                        restitution: restitution,
                        staticFriction: staticFriction,
                        motionType: _physicsBody.motionType,
                        shapeType: _physicsBody!.shape!.type,
                    } as IProxyPhysicsBody)
                }
                console.log("material", material)
            } else {
                if (proxyPhysicsBody.isEnable !== "未启用") {
                    setProxyPhysicsBody({
                        isEnable: "未启用",
                        mass: 1,
                        friction: 0.2,
                        restitution: 0.75,
                        staticFriction: 0,
                        motionType: PhysicsMotionType.DYNAMIC,
                        shapeType: PhysicsShapeType.CONTAINER
                    })
                }
            }
        }
    }, [selectObject3D, forceState])

    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name as Array<string>;
        const value = changedField.value;
        const firstName = name[0] as string;
        console.log(`${name}: ${value}`)

        if (isMesh(selectObject3D) && viewer) {
            if (firstName === "mass") {
                selectObject3D.physicsBody!.setMassProperties({mass: value});
            }
            if (firstName === "friction") {
                selectObject3D.physicsBody!.shape!.material!.friction = value;
                setProxyPhysicsBody({...proxyPhysicsBody, friction: value})
            }
            if (firstName === "restitution") {
                selectObject3D.physicsBody!.shape!.material!.restitution = value;
                setProxyPhysicsBody({...proxyPhysicsBody, restitution: value})
            }
            if (firstName === "staticFriction") {
                selectObject3D.physicsBody!.shape!.material!.staticFriction = value;
                setProxyPhysicsBody({...proxyPhysicsBody, staticFriction: value})
            }
            if (firstName === "motionType") {
                setProxyPhysicsBody({...proxyPhysicsBody, motionType: value})
            }
            if (firstName === "shapeType") {
                setProxyPhysicsBody({...proxyPhysicsBody, shapeType: value})
            }
            let obj = {}
            set(obj, firstName, value)
            setProxyPhysicsBody({...proxyPhysicsBody, ...obj})
        }
    }


    const onCancelPhysics = () => {
        if (isExtendsTransformNode(selectObject3D)) {
            selectObject3D.reservedDataStore.physicsAggregate?.dispose();
            console.log("取消物理", {
                isEnable: "未启用",
                mass: form.getFieldValue("mass"),
                friction: form.getFieldValue("friction"),
                restitution: form.getFieldValue("restitution"),
                staticFriction: form.getFieldValue("staticFriction"),
                motionType: form.getFieldValue("motionType"),
                shapeType: form.getFieldValue("shapeType"),
            })
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

    const onResetPhysics = () => {
        if (isExtendsTransformNode(selectObject3D) && viewer) {
            selectObject3D.reservedDataStore.physicsAggregate?.dispose();
            const physicsAggregate = new PhysicsAggregate(selectObject3D, proxyPhysicsBody.shapeType, {...proxyPhysicsBody}, viewer.scene);
            selectObject3D.reservedDataStore.physicsAggregate = physicsAggregate
            forceUpdate();
        }
    }

    const onCreatePhysics = () => {
        if (isExtendsTransformNode(selectObject3D) && viewer) {
            console.log("创建物理", proxyPhysicsBody)
            const physicsAggregate = new PhysicsAggregate(selectObject3D, proxyPhysicsBody.shapeType, {...proxyPhysicsBody}, viewer.scene);
            selectObject3D.reservedDataStore.physicsAggregate = physicsAggregate
            console.log("selectObject3D", selectObject3D)
            forceUpdate();
        }
    }

    const RenderStateButton = () => {
        if (proxyPhysicsBody.isEnable === "未启用") {
            return <Form.Item label="操作">
                <Button color="default" variant="filled" onClick={onCreatePhysics}>
                    创建
                </Button>
            </Form.Item>
        } else {
            return <Form.Item label="操作">
                <Space>
                    <Button color="default" variant="filled" onClick={onResetPhysics}>
                        重置
                    </Button>
                    <Button color="default" variant="filled" onClick={onCancelPhysics}>
                        取消
                    </Button>
                </Space>
            </Form.Item>
        }
    }

    const RenderMaterialList = () => {
        if (selectObject3D) {
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
                    <TextItem name={["isEnable"]} label="开启"/>

                    <InputNumberItem name={["mass"]} label="质量"/>
                    <InputNumberItem name={["friction"]} label="动态摩擦"/>
                    <InputNumberItem name={["restitution"]} label="恢复力"/>
                    <InputNumberItem name={["staticFriction"]} label="静态摩擦"/>

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