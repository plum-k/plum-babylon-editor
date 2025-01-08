import {createSelectorHooks} from "auto-zustand-selectors-hook";
import useStoreBase from "./useStoreBase.ts";

const useStore = createSelectorHooks(useStoreBase);

const useSetViewer = useStore.useSetViewer
const useViewer = useStore.useViewer
const useSetSelectObject3D = useStore.useSetSelectObject3D
const useSetSelectKey = useStore.useSetSelectKey
const useSelectObject3D = useStore.useSelectObject3D
const useSelectKey = useStore.useSelectKey

const useIsDebug = useStore.useIsDebug
const useSetIsDebug = useStore.useSetIsDebug

export {
    useViewer,
    useSetViewer,
    useSetSelectObject3D,
    useSetSelectKey,
    useSelectObject3D,
    useSelectKey,
    useIsDebug,
    useSetIsDebug
}

export default useStore