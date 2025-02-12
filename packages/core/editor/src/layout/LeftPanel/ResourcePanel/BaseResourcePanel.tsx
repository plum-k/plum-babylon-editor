import {Flex, Tabs} from "antd";
import {DragCard} from "./DragCard";
import {IDragInfo} from "../../../interface/IDragInfo.ts";
import {Mesh} from "@babylonjs/core";


export function Geometry() {
    const geometryList: IDragInfo[] = [
        {
            name: 'Box',
            label: '盒子',
            option: {
                width: 1,
                height: 1,
                depth: 1,
            },
            icon: 'icon-sphere',
        },
        {
            name: 'Sphere',
            label: '球体',
            option: {diameter: 1},
            icon: 'icon-sphere',
        },
        {
            name: 'Plane',
            label: '平面',
            option: {
                height: 2,
                width: 1,
                sideOrientation: Mesh.DOUBLESIDE
            },
            icon: 'icon-sphere',
        }
    ]


    return (
        <Flex wrap gap="small">
            {
                geometryList.map((item, index) => {
                    return (
                        <DragCard key={index} {...item}/>
                    )
                })
            }
        </Flex>
    )
}

export function Light() {
    const lightList: IDragInfo[] = [
        {
            name: 'PointLight',
            label: '点光源',
            option: {

                intensity: 1,
                range: 10,
            },
            icon: 'icon-point-light',
        },
        {
            name: 'DirectionalLight',
            label: '方向光',
            option: {
                intensity: 1,
            },
            icon: 'icon-directional-light',
        },
        {
            name: 'SpotLight',
            label: '聚光灯',
            option: {
                angle: Math.PI / 4, // 45度
                intensity: 1,
                range: 10,
            },
            icon: 'icon-spot-light',
        }
    ]


    return (
        <Flex wrap gap="small">
            {
                lightList.map((item, index) => {
                    return (
                        <DragCard key={index} {...item}/>
                    )
                })
            }
        </Flex>
    )
}

export function BaseResourcePanel() {
    return (
        <div>
            <Tabs
                tabPosition={"left"}
                defaultActiveKey="几何"
                items={[
                    {
                        label: '几何',
                        key: '几何',
                        children: <Geometry/>,
                    },
                    {
                        label: '光源',
                        key: '光源',
                        children: <Light/>,
                    },
                    // {
                    //     label: '特效',
                    //     key: '粒子',
                    //     children: 'Tab 3',
                    // },
                ]}
            />
        </div>
    )
}