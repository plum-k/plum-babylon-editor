import {Tabs} from "antd";
import {BaseResourcePanel} from "./ResourcePanel/BaseResourcePanel.tsx";
import {ParticleResourcePanel} from "./ResourcePanel/ParticleResourcePanel.tsx";
import {AssetLibrary} from "./ResourcePanel/assetLibrary/AssetLibrary.tsx";


export function ResourcePanel() {
    return (
        <div>
            <Tabs
                defaultActiveKey="基础"
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
        </div>
    )
}

