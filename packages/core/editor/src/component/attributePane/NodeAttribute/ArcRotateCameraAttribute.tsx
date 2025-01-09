import {FC, Fragment, useMemo} from "react";
import {Collapse, CollapseProps} from "antd";
import {BoolItem, InputNumberItem, NumberSliderItem, Vector3Item} from "@plum-render/common-ui";
import {useSelectObject3D, useViewer} from "../../../store";
import CameraAttribute from "./CameraAttribute.tsx";
import {ArcRotateCamera} from "@babylonjs/core";

export interface ArcRotateCameraAttributeProps {
}

const ArcRotateCameraAttribute: FC<ArcRotateCameraAttributeProps> = (props: ArcRotateCameraAttributeProps) => {
    
    const selectObject3D = useSelectObject3D();
    let camera = selectObject3D as ArcRotateCamera;
    const viewer = useViewer()

    const items = useMemo(() => {
        const list: CollapseProps['items'] = [];
        list.push({
            key: '变换',
            label: '变换',
            children: <Fragment>
                <Vector3Item basePropertyName={["target"]} label="目标"/>
                <NumberSliderItem name={["alpha"]} label="水平旋转" min={camera.lowerAlphaLimit || 0}
                                  max={camera.upperAlphaLimit || 2 * Math.PI} step={0.01}/>
                <NumberSliderItem name={["beta"]} label="垂直旋转" min={camera.lowerAlphaLimit || 0}
                                  max={camera.upperBetaLimit || 2 * Math.PI} step={0.01}/>
                <InputNumberItem name={["radius"]} label="半径"/>
            </Fragment>
        });

        list.push({
            key: '控制',
            label: '控制',
            children: <Fragment>
                <InputNumberItem name={["angularSensibilityX"]} label="水平旋转灵敏度"/>
                <InputNumberItem name={["angularSensibilityY"]} label="垂直旋转灵敏度"/>
                <InputNumberItem name={["panningSensibility"]} label="平移灵敏度"/>
                <InputNumberItem name={["pinchDeltaPercentage"]} label="收缩增加量"/>
                <InputNumberItem name={["wheelDeltaPercentage"]} label="缩放速度"/>
                <InputNumberItem name={["speed"]} label="速度"/>
            </Fragment>
        });

        list.push({
            key: '碰撞',
            label: '碰撞',
            children: <Fragment>
                <BoolItem name={["checkCollisions"]} label="启动碰撞"/>
                <Vector3Item basePropertyName="collisionRadius" label="碰撞半径"/>
            </Fragment>
        });

        list.push({
            key: '范围',
            label: '范围',
            children: <Fragment>
                <InputNumberItem name={["lowerAlphaLimit"]} label="最小水平角度"/>
                <InputNumberItem name={["upperAlphaLimit"]} label="最大水平角度"/>
                <InputNumberItem name={["lowerBetaLimit"]} label="最小垂直角度"/>
                <InputNumberItem name={["upperBetaLimit"]} label="最大垂直角度"/>
                <InputNumberItem name={["lowerRadiusLimit"]} label="最小半径"/>
                <InputNumberItem name={["upperRadiusLimit"]} label="最大半径"/>
            </Fragment>
        });

        list.push({
            key: '行为',
            label: '行为',
            children: <Fragment>
                <BoolItem name={["zoomToMouseLocation"]} label="聚焦目标"/>
                <BoolItem name={["useAutoRotationBehavior"]} label="自动旋转"/>
                <BoolItem name={["useBouncingBehavior"]} label="弹跳效果"/>
                <BoolItem name={["useFramingBehavior"]} label="自动聚焦"/>
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

export default ArcRotateCameraAttribute;
