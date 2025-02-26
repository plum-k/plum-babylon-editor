import {Flex} from "antd";
import {DragCard} from "./DragCard";
import {IDragInfo} from "../../../interface/IDragInfo.ts";
import {Mesh} from "@babylonjs/core";

export function BaseResourcePanel() {
    const geometryList: IDragInfo[] = [
        {
            type: 'Box',
            label: '盒子',
            option: {
                width: 1,
                height: 1,
                depth: 1,
            },
            icon: 'icon-component-full2',
        },
        {
            type: 'Sphere',
            label: '球体',
            option: {diameter: 1},
            icon: 'icon-qiuti',
        },
        {
            type: 'Plane',
            label: '平面',
            option: {
                height: 2,
                width: 1,
                sideOrientation: Mesh.DOUBLESIDE
            },
            icon: 'icon-pingmian',
        },
        {
            type: 'Torus',
            label: '圆环',
            option: {
                diameter: 1, thickness: 0.2
            },
            icon: 'icon-yuanhuan',
        },
    ]
    const lightList: IDragInfo[] = [
        {
            type: 'PointLight',
            label: '点光源',
            option: {
                "tags": null,
                "shadowAngle": 1.5707963267948966,
                "diffuse": [
                    1,
                    1,
                    1
                ],
                "specular": [
                    1,
                    1,
                    1
                ],
                "falloffType": 0,
                "intensity": 1,
                "range": 1.7976931348623157e+308,
                "intensityMode": 0,
                "radius": 0.00001,
                "_renderPriority": 0,
                "shadowEnabled": true,
                "excludeWithLayerMask": 0,
                "includeOnlyWithLayerMask": 0,
                "lightmapMode": 0,
                "position": [
                    0,
                    2,
                    2
                ],
                "name": "PointLight",
                "id": "PointLight",
                "state": "",
                "uniqueId": 337,
                "type": 0,
                "animations": [],
                "ranges": [],
                "isEnabled": true
            },
            icon: 'icon-dengpao',
        },
        {
            type: 'DirectionalLight',
            label: '方向光',
            option: {
                "tags": null,
                "shadowFrustumSize": 0,
                "shadowOrthoScale": 0.1,
                "autoUpdateExtends": true,
                "autoCalcShadowZBounds": false,
                "orthoLeft": 1.7976931348623157e+308,
                "orthoRight": 5e-324,
                "orthoTop": 5e-324,
                "orthoBottom": 1.7976931348623157e+308,
                "diffuse": [
                    1,
                    1,
                    1
                ],
                "specular": [
                    1,
                    1,
                    1
                ],
                "falloffType": 0,
                "intensity": 1,
                "range": 1.7976931348623157e+308,
                "intensityMode": 0,
                "radius": 0.00001,
                "_renderPriority": 0,
                "shadowEnabled": true,
                "excludeWithLayerMask": 0,
                "includeOnlyWithLayerMask": 0,
                "lightmapMode": 0,
                "position": [
                    -1,
                    -2,
                    -1
                ],
                "direction": [
                    1,
                    2,
                    1
                ],
                "name": "DirectionalLight",
                "id": "DirectionalLight",
                "state": "",
                "uniqueId": 320,
                "type": 1,
                "animations": [],
                "ranges": [],
                "isEnabled": true
            },
            icon: 'icon-fangxiangguang',
        },
        {
            type: 'HemisphericLight',
            label: '半球光',
            option: {
                "tags": null,
                "groundColor": [
                    0.4,
                    0.4,
                    0.4
                ],
                "direction": [
                    0,
                    1,
                    0
                ],
                "diffuse": [
                    1,
                    1,
                    1
                ],
                "specular": [
                    1,
                    1,
                    1
                ],
                "falloffType": 0,
                "intensity": 1,
                "range": 1.7976931348623157e+308,
                "intensityMode": 0,
                "radius": 0.00001,
                "_renderPriority": 0,
                "shadowEnabled": true,
                "excludeWithLayerMask": 0,
                "includeOnlyWithLayerMask": 0,
                "lightmapMode": 0,
                "name": "HemisphericLight",
                "id": "HemisphericLight",
                "state": "",
                "uniqueId": 294,
                "type": 3,
                "animations": [],
                "ranges": [],
                "isEnabled": true
            },
            icon: 'icon-banqiuguang',
        },
        {
            type: 'SpotLight',
            label: '聚光灯',
            option: {
                "tags": null,
                "angle": 0.5235987755982988,
                "innerAngle": 0,
                "exponent": 0.5,
                "projectionTextureLightNear": 0.000001,
                "projectionTextureLightFar": 1000,
                "projectionTextureUpDirection": {
                    "_isDirty": true,
                    "_x": 0,
                    "_y": 1,
                    "_z": 0
                },
                "diffuse": [
                    1,
                    1,
                    1
                ],
                "specular": [
                    1,
                    1,
                    1
                ],
                "falloffType": 0,
                "intensity": 1,
                "range": 1.7976931348623157e+308,
                "intensityMode": 0,
                "radius": 0.00001,
                "_renderPriority": 0,
                "shadowEnabled": true,
                "excludeWithLayerMask": 0,
                "includeOnlyWithLayerMask": 0,
                "lightmapMode": 0,
                "position": [
                    2,
                    2,
                    2
                ],
                "direction": [
                    0,
                    -1,
                    0
                ],
                "name": "SpotLight",
                "id": "SpotLight",
                "state": "",
                "uniqueId": 375,
                "type": 2,
                "animations": [],
                "ranges": [],
                "isEnabled": true
            },
            icon: 'icon-a-24_nor',
        }
    ]
    return (
        <Flex wrap gap="small">
            {
                [...geometryList, ...lightList].map((item, index) => {
                    return (
                        <DragCard key={index} {...item}/>
                    )
                })
            }
        </Flex>
    )
}