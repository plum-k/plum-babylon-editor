import {createRef, Fragment, RefObject, useEffect, useRef} from "react";
import {useSetViewer, useViewer} from "../store";
import {isNil} from "lodash-es";
import {useParams} from "react-router-dom";
import {IFolder} from "common";
import {Control} from "../component/SidePane";
import {PlumArcRotateCamera, Viewer} from "@plum-render/babylon-sdk";
import {type Id, toast} from "react-toastify";
import {ImperativePanelHandle} from "react-resizable-panels";
import PanelCollapsed from "../component/PanelCollapsed.tsx";

export interface ISceneViewProps {
    leftPanelRef: RefObject<ImperativePanelHandle | null>
    rightPanelRef: RefObject<ImperativePanelHandle | null>
}

export default function SceneView(props: ISceneViewProps) {
    const {leftPanelRef, rightPanelRef} = props;
    const canvasContainer = createRef<HTMLDivElement>();
    const viewer = useViewer()
    const setViewer = useSetViewer()
    const {appId} = useParams();
    const toastId = useRef<Id>(null);
    useEffect(() => {
        if (canvasContainer.current && isNil(viewer)) {

            let _viewer = new Viewer(canvasContainer.current, {
                appId: appId,
                packageType: "chunk",
                isCreateDefaultEnvironment: true,
                isCreateDefaultLight: true,
                cosApiOptions: {
                    bucketParams: {
                        Bucket: import.meta.env.VITE_BUCKET,
                        Region: import.meta.env.Region,
                    },
                    COSOptions: {
                        SecretId: import.meta.env.VITE_SECRETID,
                        SecretKey: import.meta.env.VITE_SECRETKEY,
                    }
                }
            })
            // todo
            _viewer.sceneLoadProgressSubject.subscribe((event) => {
                const {total, progress} = event;
                if (event.type === "unZip") {
                    const _progress = progress / total;
                    if (toastId.current === null) {
                        toastId.current = toast('正在加载场景中!', {progress: _progress, position: 'top-right',});
                    } else {
                        toast.update(toastId.current, {progress: _progress});
                    }
                }
            })
            _viewer.initSubject.subscribe(() => {
                _viewer.enableEditor();
                if (toastId.current !== null) {
                    toast.done(toastId.current);
                }
                setViewer(_viewer);
                let camera = _viewer.scene.activeCamera! as PlumArcRotateCamera;
                console.log(camera)

                // testSerialize(_viewer);
                // testMesh(_viewer)
            })
        }

    }, [canvasContainer])

    const loadMode = (node: IFolder) => {
        const {name} = node;
        // COSApi.getObjectUrl(name).then((url) => {
        //     console.log(url)
        // })
    }


    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        // console.log(e)
        // todo
        // event.preventDefault();
        //     const data = event.dataTransfer.getData('data')
        //     const value = JSON.parse(data)
        //     loadMode(value)
    }


    return (
        <Fragment>
            <div className="viewer-container w-full h-full relative" ref={canvasContainer}>
                <Control/>
                <PanelCollapsed panelRef={leftPanelRef} direction={"left"}/>
                <PanelCollapsed panelRef={rightPanelRef} direction={"right"}/>
            </div>
        </Fragment>
    )
}

