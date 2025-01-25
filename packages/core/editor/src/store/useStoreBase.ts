import {create} from 'zustand'
import {Viewer} from "@plum-render/babylon-sdk";
import {Key} from "react";
import {Node, Nullable} from "@babylonjs/core";
import {IApplication} from "../interface";

type State = {
    viewer: Viewer | null,
    selectKey: Array<Key>,
    selectObject3D: Nullable<Node>,
    isDebug: boolean,
    appInfo: IApplication | null
}
type Action = {
    setViewer: (viewer: State['viewer']) => void,
    setSelectKey: (selectUUid: State['selectKey']) => void,
    setSelectObject3D: (value: State['selectObject3D']) => void,
    setIsDebug: (value: State['isDebug']) => void,
    setAppInfo: (value: State['appInfo']) => void,
}
export const useStoreBase = create<State & Action>((set) => ({
    viewer: null,
    selectKey: [],
    selectObject3D: null,
    appInfo:null,
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
    setAppInfo: (value) => {
        set(() => {
            return {
                appInfo: value
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

