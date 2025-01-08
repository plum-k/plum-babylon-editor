import {createSelectorHooks} from "auto-zustand-selectors-hook";
import useStoreBase from "./useStoreBase.ts";

const useStore = createSelectorHooks(useStoreBase);

const useSelectApp = useStore.useSelectApp;
const useSetSelectApp = useStore.useSetSelectApp;

export {
    useSelectApp,
    useSetSelectApp,
}

export default useStore