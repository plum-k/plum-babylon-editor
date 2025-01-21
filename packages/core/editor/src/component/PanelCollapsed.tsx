import {RefObject, useEffect, useState} from "react";
import {ImperativePanelHandle} from "react-resizable-panels";
import {CaretLeftOutlined, CaretRightOutlined} from "@ant-design/icons";
import {useViewer} from "../store";

export interface IPanelCollapsedProps {
    panelRef: RefObject<ImperativePanelHandle | null>;
    direction: "left" | "right";
}

export function PanelCollapsed(props: IPanelCollapsedProps) {
    const {panelRef, direction} = props;
    const isLeft = direction === "left";
    const viewer = useViewer()
    const resize = () => {
        if (viewer) {
            window.setTimeout(() => {
                viewer.resize()
            }, 1)
        }
    }
    useEffect(() => {
        console.log(panelRef)
        const panel = panelRef.current;
        if (panel) {
            setPanelCollapsed(panel.isCollapsed())
        }
    }, [panelRef]);

    const [panelCollapsed, setPanelCollapsed] = useState(false);
    const click = () => {
        const panel = panelRef.current;
        if (panel) {
            if (panel.isCollapsed()) {
                panel.expand()
                setPanelCollapsed(false)
            } else {
                panel.collapse()
                setPanelCollapsed(true)
            }
            resize()
        }
    }
    return (
        <div className="absolute top-2/3 cursor-pointer z-50"
             style={{
                 left: isLeft ? "0" : undefined,
                 right: isLeft ? undefined : "0",
             }}
             onClick={click}>
            {
                (isLeft ? panelCollapsed : !panelCollapsed) ?
                    <CaretRightOutlined className="text-3xl" style={{color: "rgba(246, 246, 247, 0.5)"}}/> :
                    <CaretLeftOutlined className="text-3xl" style={{color: "rgba(246, 246, 247, 0.5)"}}/>
            }
        </div>
    )
}