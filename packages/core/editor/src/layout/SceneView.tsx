import {createRef, DragEventHandler, Fragment, RefObject, useEffect} from "react";
import {useSetAppInfo, useSetViewer, useViewer} from "../store";
import {isNil, uniqueId} from "lodash-es";
import {useParams} from "react-router-dom";
import {ESceneLoadType, ESceneSaveType, PlumParticle, SmokeParticle, Viewer} from "@plum-render/babylon-sdk";
import {type Id, toast} from "react-toastify";
import {ImperativePanelHandle} from "react-resizable-panels";
import {Control, PanelCollapsed} from "../component";
import {ApplicationApi} from "../api";
import {IDragInfo} from "../interface/IDragInfo";
import {Light, Mesh, MeshBuilder, Node, PointLight} from "@babylonjs/core";

export interface ISceneViewProps {
    leftPanelRef: RefObject<ImperativePanelHandle | null>
    rightPanelRef: RefObject<ImperativePanelHandle | null>
}

export function SceneView(props: ISceneViewProps) {
    const {leftPanelRef, rightPanelRef} = props;
    const canvasContainer = createRef<HTMLDivElement>();
    const viewer = useViewer()
    const setAppInfo = useSetAppInfo()
    const setViewer = useSetViewer()
    const {appId} = useParams();
    const loadIdMao = new Map<string, Id>();
    const saveIdMao = new Map<string, Id>();

    useEffect(() => {
        ApplicationApi.getById(appId!).then((res) => {
            if (res.code === 1) {
                console.log(res)
                setAppInfo(res.data);

                document.title = res.data.name;
            }
        })
    }, []);

    useEffect(() => {
        if (canvasContainer.current && isNil(viewer)) {
            let _viewer = new Viewer(canvasContainer.current, {
                appId: appId,
                packageType: "chunk",
                isCreateDefaultEnvironment: true,
                isCreateDefaultLight: true,
                ossApiOptions: {
                    server: import.meta.env.VITE_SERVER,
                    bucket: import.meta.env.VITE_BUCKET,
                    region: import.meta.env.VITE_REGION,
                }
            })
            // 场景加载进度条
            _viewer.sceneLoadProgressSubject.subscribe((event) => {
                const {type, name, total, loaded} = event;
                const _progress = loaded / total;
                const id = loadIdMao.get(name);
                if (id === undefined) {
                    if (type === ESceneLoadType.Load) {
                        const newId = toast.loading(name, {position: 'top-right',});
                        loadIdMao.set(name, newId);
                    } else {
                        if (total === loaded) {
                            return
                        }
                        const newId = toast(name, {progress: _progress, position: 'top-right',});
                        loadIdMao.set(name, newId);
                    }
                } else {
                    if (type === ESceneLoadType.Load) {
                        toast.update(id, {render: "场景加载成功", type: "success", isLoading: false, autoClose: 3000});
                        loadIdMao.clear()
                    } else {
                        toast.update(id, {render: name, progress: _progress});
                        if (loaded === total) {
                            toast.done(id);
                        }
                    }
                }
            })
            // 厂家保存监听
            _viewer.sceneSaveProgressSubject.subscribe((event) => {
                const {type, name, total, loaded} = event;
                const _progress = loaded / total;
                const id = saveIdMao.get(name);
                if (id === undefined) {
                    if (type === ESceneSaveType.Save) {
                        const newId = toast.loading(name, {position: 'top-right',});
                        saveIdMao.set(name, newId);
                    } else {
                        if (total === loaded) {
                            return
                        }
                        const newId = toast(name, {progress: _progress, position: 'top-right',});
                        saveIdMao.set(name, newId);
                    }
                } else {
                    if (type === ESceneSaveType.Save) {
                        toast.update(id, {render: "场景保存成功", type: "success", isLoading: false, autoClose: 3000});
                        saveIdMao.clear()
                    } else {
                        toast.update(id, {render: name, progress: _progress});
                        if (loaded === total) {
                            toast.done(id);
                        }
                    }
                }
            })

            _viewer.initSubject.subscribe(() => {
                _viewer.enableEditor();
                setViewer(_viewer);
                // testSerialize(_viewer);
                // testMesh(_viewer,"scene.glb")
                // testPhysics(_viewer)
                // tesProjection(_viewer)
            })
        }

    }, [canvasContainer])

    const onDrop: DragEventHandler<HTMLDivElement> = async (event) => {
        console.log("拖动", event)
        if (!event.dataTransfer) return
        const data = event.dataTransfer.getData('data');
        const info = JSON.parse(data) as IDragInfo;
        console.log(info)
        const option = info.option;
        const scene = viewer!.scene;
        const position = viewer!.screenToWorldOrPick(event as unknown as DragEvent);
        let node: Node | PlumParticle | null = null;
        switch (info.type) {
            case "Box":
                node = MeshBuilder.CreateBox("Box", {size: 1});
                break;
            case "Sphere":
                node = MeshBuilder.CreateSphere("Sphere", {diameter: 1});
                break;
            case "PointLight":
            case "DirectionalLight":
            case "SpotLight":
            case "HemisphericLight":
                node = Light.Parse(option, scene);
                break;
            case "SmokeParticle":
                node = new SmokeParticle({
                    name: "smoke",
                    capacity: 1000,
                    viewer: viewer!,
                    ...option
                })
                node.build()
                node.start()
                break;
            case "model":
                const {rawName, name, url} = info;
                const blob = await viewer!.ossApi!.getObject(rawName);
                let file = new File([blob], rawName);
                let meshAssetTask = viewer!.assetsManager.addPlumMeshTask(`${uniqueId(name)}`, "", "file:", file);
                meshAssetTask.onSuccess = (task) => {
                    const baseMesh = task.loadedMeshes[0];
                    baseMesh.position.copyFrom(position);
                    viewer!.editor.addObjectCommandExecute({
                        source: "editor",
                        object: baseMesh
                    });
                }
                viewer!.assetsManager.load();
                break;
            default:
                break;
        }
        if (node) {
            if (node instanceof Mesh) {
                node.position.copyFrom(position);
            } else if (node instanceof PointLight) {
                node.position.copyFrom(position);
            }
            if (node instanceof PlumParticle) {
                node.setPosition(position)
                viewer?.editor.editorEventManager.sceneGraphChanged.next(true);
            } else {
                viewer!.editor.addObjectCommandExecute({
                    source: "editor",
                    object: node
                });
            }
        }
    }

    return (
        <Fragment>
            <div className="viewer-container w-full h-full relative" ref={canvasContainer} onDrop={onDrop}>
                <Control/>
                <PanelCollapsed panelRef={leftPanelRef} direction={"left"}/>
                <PanelCollapsed panelRef={rightPanelRef} direction={"right"}/>
            </div>
        </Fragment>
    )
}

