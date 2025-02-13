import {ModelAsset} from "./ModelAsset";
import {Tabs} from "antd";

export function AssetLibrary() {
    // const items = useMemo(()=>{
    //
    //
    //     return []
    // })

    return (
        <div>
            <Tabs
                tabPosition={"left"}
                defaultActiveKey="模型"
                items={[
                    {
                        label: '模型',
                        key: '模型',
                        children: <ModelAsset/>,
                    },
                    // {
                    //     label: '材质',
                    //     key: '材质',
                    //     children: <ParticleResourcePanel/>,
                    // },
                    // {
                    //     label: '天空盒',
                    //     key: '天空盒',
                    //     children: <AssetLibrary/>,
                    // }
                ]}
            />
        </div>
    )
}