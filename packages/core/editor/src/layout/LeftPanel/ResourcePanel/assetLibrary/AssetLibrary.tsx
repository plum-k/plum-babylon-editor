import {AssetPanel} from "./AssetPanel.tsx";
import {GetRef, Tabs, Tree} from "antd";
import {useRef, useState} from "react";

export function AssetLibrary() {
    // const items = useMemo(()=>{
    //
    //
    //     return []
    // })
    const [activeKey, setActiveKey] = useState("activeKey");
    type treeRef = GetRef<typeof Tree>;
    const treeRef = useRef<treeRef>(null);
    const onTabClick: Tabs["onTabClick"] = (activeKey: string) => {
        console.log(activeKey)

        setActiveKey(activeKey);
    }
    return (
        <div>
            <Tabs
                tabPosition={"left"}
                defaultActiveKey="模型"
                items={[
                    {
                        label: '模型',
                        key: 'models/',
                        children: <AssetPanel baseName={"models/"} activeKey={activeKey}/>,
                    },
                    {
                        label: '材质',
                        key: 'material/',
                        children: <AssetPanel baseName={"material/"} activeKey={activeKey}/>,
                    },
                    // {
                    //     label: '天空盒',
                    //     key: '天空盒',
                    //     children: <AssetLibrary/>,
                    // }
                ]}
                onTabClick={onTabClick}
            />
        </div>
    )
}