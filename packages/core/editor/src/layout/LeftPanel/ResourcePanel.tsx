import {Tabs} from "antd";
import {BaseResourcePanel} from "./ResourcePanel/BaseResourcePanel.tsx";
import {ParticleResourcePanel} from "./ResourcePanel/ParticleResourcePanel.tsx";


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
                    label: 'Tab 3',
                    key: '3',
                    children: 'Tab 3',
                },
                    ]}
            />
        </div>
    )
}

