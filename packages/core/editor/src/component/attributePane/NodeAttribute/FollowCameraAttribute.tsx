import {Fragment, useMemo} from "react";
import {Collapse, CollapseProps} from "antd";
import {InputNumberItem, Vector3Item} from "@plum-render/common-ui";
import {useSelectObject3D} from "../../../store";
import CameraAttribute from "./CameraAttribute.tsx";

export default function FollowCameraAttribute() {
    const {} = props;
    const selectObject3D = useSelectObject3D();
    const items = useMemo(() => {
        const list: CollapseProps['items'] = [];
        list.push({
            key: '变换',
            label: '变换',
            children: <Fragment>
                <InputNumberItem name={["radius"]} label="近裁剪平面"/>
                <InputNumberItem name={["rotationOffset"]} label="远裁剪平面"/>
                <InputNumberItem name={["heightOffset"]} label="视野"/>
                <InputNumberItem name={["cameraAcceleration"]} label="左"/>
            </Fragment>
        });

        list.push({
            key: '限制',
            label: '限制',
            children: <Fragment>
                <Vector3Item basePropertyName="lowerRadiusLimit" label="下限半径"/>
                <Vector3Item basePropertyName="upperRadiusLimit" label="上限半径"/>
                <Vector3Item basePropertyName="lowerRotationOffsetLimit" label="下限角度"/>
                <Vector3Item basePropertyName="upperRotationOffsetLimit" label="上限角度"/>
                <Vector3Item basePropertyName="lowerHeightOffsetLimit" label="下限贝塔角度"/>
                <Vector3Item basePropertyName="upperHeightOffsetLimit" label="上限贝塔角度"/>
                <Vector3Item basePropertyName="maxCameraSpeed" label="使用自动旋转行为"/>
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

