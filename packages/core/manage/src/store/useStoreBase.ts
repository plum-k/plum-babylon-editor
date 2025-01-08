import {create} from 'zustand'
import {ApplicationModel} from "plum-render-server";

type State = {
    selectApp: ApplicationModel | undefined,
}
type Action = {
    setSelectApp: (viewer: State['selectApp']) => void,
}
const useStoreBase = create<State & Action>((set) => ({
    selectApp: undefined,
    setSelectApp: (value) => {
        set((state) => {
            return {
                selectApp: value
            }
        })
    },

}))

export default useStoreBase;