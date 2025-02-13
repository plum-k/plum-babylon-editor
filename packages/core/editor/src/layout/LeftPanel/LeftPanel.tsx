import {Splitter} from 'antd';
import {ResourcePanel} from "./ResourcePanel.tsx";
import {SceneTree} from "./SceneTree.tsx";

export function LeftPanel() {
    return (
        <div className="bg-white overflow-hidden h-full w-full m-0 pb-5">
            <Splitter layout="vertical" style={{boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'}}>
                <Splitter.Panel>
                    <SceneTree/>
                </Splitter.Panel>
                <Splitter.Panel>
                    <ResourcePanel/>
                </Splitter.Panel>
            </Splitter>
        </div>
    )
}