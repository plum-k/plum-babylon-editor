import {Button, Tooltip} from "antd";
import {useViewer} from "../../store";
import {
    CameraOutlined,
    FullscreenExitOutlined,
    FullscreenOutlined,
    StopOutlined,
    UngroupOutlined,
    VideoCameraOutlined
} from "@ant-design/icons";
import {useFullscreen} from "ahooks";
import {Nullable, Tools, VideoRecorder} from "@babylonjs/core";
import {Fragment, useState} from "react";

let videoRecorder: Nullable<VideoRecorder> = null;

export default function HeaderTool() {
    const viewer = useViewer();
    // 焦点到场景
    const focusToScene = () => {
        viewer?.cameraControls.focusToScene();
    }
    // 全屏操作
    const [isFullscreen, {toggleFullscreen, enterFullscreen, exitFullscreen}] = useFullscreen(() => {
        return document.body;
    }, {
        pageFullscreen: false,
    });

    // 截屏操作
    const createScreenshot = () => {
        if (viewer) {
            Tools.CreateScreenshot(viewer.scene.getEngine(), viewer.scene.activeCamera!, {precision: 1});
        }
    }

    // 是否正在录频
    const [isRecording, setIsRecording] = useState(false);
    // 录频操作
    const recordVideo = () => {
        if (videoRecorder === null && viewer) {
            videoRecorder = new VideoRecorder(viewer.scene.getEngine());
        }
        if (videoRecorder && videoRecorder.isRecording) {
            videoRecorder.stopRecording();
            setIsRecording(false);
            return;
        }

        videoRecorder!.startRecording().then(() => {
            setIsRecording(true);
        });
    }

    return (
        <Fragment>
            <div className="ml-36">
                <Tooltip title="聚焦场景">
                    <Button color="default" variant="text" icon={<UngroupOutlined/>} onClick={focusToScene}/>
                </Tooltip>
                {
                    isFullscreen ? <Tooltip title="退出全屏">
                        <Button color="default" variant="text" icon={<FullscreenExitOutlined/>}
                                onClick={exitFullscreen}/>
                    </Tooltip> : <Tooltip title="全屏">
                        <Button color="default" variant="text" icon={<FullscreenOutlined/>} onClick={enterFullscreen}/>
                    </Tooltip>
                }
                <Tooltip title="截屏">
                    <Button color="default" variant="text" icon={<CameraOutlined/>} onClick={createScreenshot}/>
                </Tooltip>
                {
                    isRecording ? <Tooltip title="停止录频">
                        <Button color="default" variant="text" icon={<StopOutlined/>} onClick={recordVideo}/>
                    </Tooltip> : <Tooltip title="录频">
                        <Button color="default" variant="text" icon={<VideoCameraOutlined/>} onClick={recordVideo}/>
                    </Tooltip>
                }
            </div>
        </Fragment>

    )

}