import {Flex} from "antd";
import {DragCard} from "./DragCard";
import {IDragInfo} from "../../../interface/IDragInfo.ts";

export function ParticleResourcePanel() {
    const particleList: IDragInfo[] = [
        {
            label: '火焰-CPU',
            option: {
                isGpu: false
            },
            icon: 'icon-huo',
            type: "FireParticle"
        },
        {
            label: '火焰-GPU',
            option: {
                isGpu: true
            },
            icon: 'icon-huo',
            type: "FireParticle"
        },
        {
            label: '烟雾-CPU',
            option: {
                isGpu: false
            },
            icon: 'icon-yanwu',
            type: "SmokeParticle"
        },
        {
            label: '烟雾-GPU',
            option: {
                isGpu: true
            },
            icon: 'icon-yanwu',
            type: "SmokeParticle"
        },
        {
            label: '爆炸',
            option: {},
            icon: 'icon-Forme',
            type: "SmokeParticle"
        },
    ]
    return (
        <Flex wrap gap="small">
            {
                [...particleList].map((item, index) => {
                    return (
                        <DragCard key={index} {...item}/>
                    )
                })
            }
        </Flex>
    )
}