import {CSSProperties, FC, Fragment, useEffect, useState} from "react";
import {ArrowsAltOutlined, FullscreenOutlined, RedoOutlined} from "@ant-design/icons";
import {Segmented} from "antd";
import {useIsDebug, useViewer} from "../../store";
import {GizmoEnum} from "@plum-render/babylon-sdk";

const Control: FC = () => {
    const viewer = useViewer()
    useEffect(() => {
    }, [viewer])
    const [mode, setMode] = useState(GizmoEnum.Position)

    const isDebug = useIsDebug();

    const [contrlCss, setContrlCss] = useState<CSSProperties>({
        left: '10px',
    })

    useEffect(() => {
        if (isDebug) {
            setContrlCss({
                left: '310px',
            })
        } else {
            setContrlCss({
                left: '10px',
            })
        }
    }, [isDebug])

    const handleClick = (value: GizmoEnum) => {
        if (viewer) {
            setMode(value)
            viewer.editor.gizmoManager.setGizmoType(value)
        }
    }

    return (
        <Fragment>
            <div style={{
                zIndex: 9999,
                position: "absolute",
                top: "20px",
                ...contrlCss
            }}>
                <Segmented
                    vertical
                    size={'large'}
                    options={[
                        {value: GizmoEnum.Position, icon: <FullscreenOutlined/>},
                        {value: GizmoEnum.Rotation, icon: <RedoOutlined/>},
                        {value: GizmoEnum.Scale, icon: <ArrowsAltOutlined/>},
                    ]}
                    onChange={handleClick}
                />
            </div>
        </Fragment>
    )
}

export default Control;
