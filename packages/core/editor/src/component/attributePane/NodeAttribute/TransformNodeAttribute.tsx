import React, {Fragment} from "react";
import {BoolItem, InputNumberItem, Vector3Item} from "@plum-render/common-ui";
import {Button, Collapse, Flex, Space} from "antd";
import {isArray} from "lodash-es";
import {AnimationGroup, Skeleton} from "@babylonjs/core";
import {PauseCircleOutlined, PlayCircleOutlined, StopOutlined} from "@ant-design/icons";
import {useSelectObject3D} from "../../../store";
import {useForceUpdate} from "../../../hooks/useForceUpdate.ts";

export default function TransformNodeAttribute() {
    const selectObject3D = useSelectObject3D();

    const [forceState, forceUpdate] = useForceUpdate();

    const onPause = (item: AnimationGroup) => {
        item.pause();
        forceUpdate();
    }
    const onPlay = (item: AnimationGroup) => {
        item.play(true);
        forceUpdate();
    }
    const onStop = (item: AnimationGroup) => {
        item.stop();
        forceUpdate();
    }
    const onReset = (items:AnimationGroup[]) => {
        const skeleton = selectObject3D?.reservedDataStore?.skeleton as  Skeleton
        if (skeleton){
            skeleton.returnToRest();
        }
        forceUpdate();
    }

    const renderAnimations = () => {
        if (selectObject3D && selectObject3D.reservedDataStore && isArray(selectObject3D.reservedDataStore.animations)) {
            const animations = selectObject3D.reservedDataStore.animations as AnimationGroup[];
            console.log(animations)
            let obj = {
                key: '动画',
                label: '动画',
                children: <div>
                    {
                        animations.map((item, index) => {
                            const {isPlaying} = item;
                            return <Flex key={index} justify={"center"} align={"center"}>
                                <div className={"w-1/2 text-2xl"}>{item.name}</div>
                                <div className={"w-1/2 text-2xl cursor-pointer"}>
                                    <Space>
                                        {
                                            isPlaying ? <PauseCircleOutlined onClick={() => onPause(item)}/> :
                                                <PlayCircleOutlined onClick={() => onPlay(item)}/>
                                        }
                                        <StopOutlined onClick={() => onStop(item)}/>
                                    </Space>
                                </div>
                            </Flex>
                        })
                    }
                    <Button color="default" variant="filled" onClick={()=>onReset(animations)}>
                        回到初始姿态
                    </Button>
                </div>
            }
            return obj;
        }
        return {}
    }

    return (
        <Fragment>
            <BoolItem name={["isEnabled"]} label="是否启用"/>
            <BoolItem name={["isPickable"]} label="是否锁定"/>
            <InputNumberItem name={["geometryUniqueId"]} label="网格id"/>
            <Vector3Item basePropertyName={["position"]} label="位置"/>
            <Vector3Item
                basePropertyName={["rotation"]}
                label="旋转"
                toDegrees
            />
            <Vector3Item basePropertyName={["scaling"]} label="缩放"/>
            <Collapse items={[renderAnimations()]} bordered={false} ghost defaultActiveKey={['动画']}/>
            {/*<JsonItem itemProps={{label: "自定义数据", name: "metadata"}}/>*/}
        </Fragment>
    )
}

