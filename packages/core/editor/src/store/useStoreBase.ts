import {create} from 'zustand'
import {Viewer} from "@plum-render/babylon-sdk";
import {Key} from "react";
import {Node, Nullable} from "@babylonjs/core";

type State = {
    viewer: Viewer | undefined,
    selectKey: Array<Key>,
    selectObject3D: Nullable<Node>,
    isDebug: boolean,
}
type Action = {
    setViewer: (viewer: State['viewer']) => void,
    setSelectKey: (selectUUid: State['selectKey']) => void,
    setSelectObject3D: (value: State['selectObject3D']) => void,
    setIsDebug: (value: State['isDebug']) => void,
}
const useStoreBase = create<State & Action>((set) => ({
    viewer: undefined,
    selectKey: [],
    selectObject3D: null,
    isDebug: false,
    setViewer: (viewer) => {
        set(() => {
            return {
                viewer: viewer
            }
        })
    },
    setSelectKey: (value) => {
        set(() => {
            return {
                selectKey: value
            }
        })
    },
    setSelectObject3D: (value) => {
        set(() => {
            return {
                selectObject3D: value
            }
        })
    },
    setIsDebug: (value) => {
        set(() => {
            return {
                isDebug: value
            }
        })
    },
}))

export default useStoreBase;