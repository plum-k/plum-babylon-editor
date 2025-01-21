import {Fragment, useRef} from "react";
import {ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";
import {useViewer} from "../store";
import {SceneTree} from "./SceneTree.tsx";
import {SceneView} from "./SceneView.tsx";
import {AttributePane} from "./AttributePane.tsx";

export  function Layout() {
    const viewer = useViewer()
    const onLayout = () => {
        if (viewer) {
            viewer.resize()
        }
    }

    const leftPanelRef = useRef<ImperativePanelHandle>(null);
    const rightPanelRef = useRef<ImperativePanelHandle>(null);

    return (
        <Fragment>
            <PanelGroup style={{height: "calc(100% - 32px)"}} direction="horizontal" onLayout={onLayout}>
                <Panel ref={leftPanelRef} defaultSize={20} collapsible minSize={10}>
                    <SceneTree/>
                </Panel>
                <PanelResizeHandle className={"ResizeHandle"}/>
                <Panel defaultSize={60}>
                    <SceneView leftPanelRef={leftPanelRef} rightPanelRef={rightPanelRef}/>
                </Panel>
                <PanelResizeHandle className={"ResizeHandle"}/>
                <Panel ref={rightPanelRef} defaultSize={20} collapsible minSize={10}>
                    <AttributePane/>
                </Panel>
            </PanelGroup>
        </Fragment>
    )
}

