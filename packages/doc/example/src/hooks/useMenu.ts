import {useLocalStorage} from "@vueuse/core";

let expandedKeys = useLocalStorage("expandedKeys", [])
let menuValue = useLocalStorage("menuValue", "")
export {expandedKeys, menuValue}


