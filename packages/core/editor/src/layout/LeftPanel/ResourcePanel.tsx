import {Tabs} from "antd";
import {BaseResourcePanel} from "./ResourcePanel/BaseResourcePanel.tsx";


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
                        label: 'Tab 2',
                        key: '2',
                        children: 'Tab 2',
                        disabled: true,
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