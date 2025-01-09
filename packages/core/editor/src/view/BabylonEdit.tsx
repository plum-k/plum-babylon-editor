import {Fragment} from "react";
import Layout from "../Layout/Layout.tsx";
import Header from "../Layout/header/Header.tsx";
import {useSelectObject3D, useViewer} from "../store";
import {useHotkeys} from "react-hotkeys-hook";
import '../styles/index.css'
import {ToastContainer} from "react-toastify";

export default function BabylonEdit() {
    const viewer = useViewer()
    const selectObject3D = useSelectObject3D()
    useHotkeys('ctrl+z', () => {
        console.log("撤销");
        if (viewer) {
            viewer.editor.undo();
        }
    }, [viewer])
    useHotkeys('ctrl+y', () => {
        console.log("回退")
        if (viewer) {
            viewer.editor.redo();
        }
    }, [viewer])
    useHotkeys('delete', () => {
        console.log("删除", selectObject3D)
        if (viewer && selectObject3D) {
            viewer.editor.removeObjectExecute({
                source: "editor",
                object: selectObject3D
            });
        }
    }, [viewer, selectObject3D])

    return (
        <Fragment>
            <Header/>
            <Layout/>
            <ToastContainer/>
        </Fragment>
    )
}

