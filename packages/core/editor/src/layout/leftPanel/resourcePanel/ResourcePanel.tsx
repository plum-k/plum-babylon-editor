import {Tabs} from "antd";
import {BaseResourcePanel} from "./resourcePanel/BaseResourcePanel.tsx";
import {ParticleResourcePanel} from "./resourcePanel/ParticleResourcePanel.tsx";
import {AssetLibrary} from "./resourcePanel/assetLibrary/AssetLibrary.tsx";


export function ResourcePanel() {
    return (
            <Tabs
                defaultActiveKey="资产库"
                items={[
                    {
                        label: '基础',
                        key: '基础',
                        children: <BaseResourcePanel/>,
                    },
                    {
                        label: '粒子',
                        key: '粒子',
                        children: <ParticleResourcePanel/>,
                    },
                    {
                        label: '资产库',
                        key: '资产库',
                        children: <AssetLibrary/>,
                    }
                ]}
            />
    )
}

