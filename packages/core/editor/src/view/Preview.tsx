import {createRef, useEffect} from "react";
import {useParams} from "react-router";
import {ESceneLoadType, ESceneSaveType, Viewer} from "@plum-render/babylon-sdk";
import {type Id, toast} from "react-toastify";

export default function Preview() {
    const {appId} = useParams();
    const loadIdMao = new Map<string, Id>();
    const saveIdMao = new Map<string, Id>();
    const canvasContainer = createRef<HTMLDivElement>();
    useEffect(() => {
        if (canvasContainer.current) {
            console.log("初始化")
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
        }
    }, [canvasContainer])
    return (
        <div className="viewer-container w-full h-full relative" ref={canvasContainer}>

        </div>
    )
}