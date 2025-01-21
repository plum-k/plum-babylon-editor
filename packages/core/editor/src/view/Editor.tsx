import {Fragment} from "react";
import {useSelectObject3D, useViewer} from "../store";
import {useHotkeys} from "react-hotkeys-hook";
import '../styles/index.css'
import {ToastContainer} from "react-toastify";
import {Header, Layout} from "../layout";

export default   function Editor() {
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

