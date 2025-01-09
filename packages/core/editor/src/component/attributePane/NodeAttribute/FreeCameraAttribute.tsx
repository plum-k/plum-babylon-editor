import {Fragment, useMemo} from "react";
import {Collapse, CollapseProps} from "antd";
import {BoolItem, InputNumberItem, Vector3Item} from "@plum-render/common-ui";
import {useSelectObject3D} from "../../../store";
import CameraAttribute from "./CameraAttribute.tsx";


export default function FreeCameraAttribute() {
    
    const selectObject3D = useSelectObject3D();
    const items = useMemo(() => {
        const list: CollapseProps['items'] = [];
        list.push({
            key: '变换',
            label: '变换',
            children: <Fragment>
                <Vector3Item label="目标" basePropertyName={["target"]}/>
                <Vector3Item label="位置" basePropertyName={["position"]}/>
                <Vector3Item label="旋转" basePropertyName={["rotation"]} toDegrees/>
            </Fragment>
        });
        list.push({
            key: '控制',
            label: '控制',
            children: <Fragment>
                <InputNumberItem label="灵敏度" name="angularSensibility"/>
                <InputNumberItem label="速度" name="speed"/>
            </Fragment>
        });
        list.push({
            key: '碰撞',
            label: '碰撞',
            children: <Fragment>
                <BoolItem label="启用碰撞检测" name={["checkCollisions"]}/>
                <BoolItem label="启用重力" name={["applyGravity"]}/>
                <Vector3Item label="碰撞体大小" name={["ellipsoid"]}/>
                <Vector3Item label="碰撞体偏移" basePropertyName="ellipsoidOffset"/>
            </Fragment>
        });
        return list;
    }, [selectObject3D]);
    return (
        <Fragment>
            <CameraAttribute/>
            <Collapse items={items} bordered={false} ghost defaultActiveKey={['1']}/>
        </Fragment>
    )
}

