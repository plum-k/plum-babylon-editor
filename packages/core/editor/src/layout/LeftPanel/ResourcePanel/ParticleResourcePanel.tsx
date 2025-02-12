import {Flex} from "antd";
import {DragCard} from "./DragCard";
import {IDragInfo} from "../../../interface/IDragInfo.ts";
import {Mesh} from "@babylonjs/core";

export function ParticleResourcePanel() {
    const particleList: IDragInfo[] = [
        {
            name: 'Fire',
            label: '火焰',
            option: {

            },
            icon: 'icon-component-full2',
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