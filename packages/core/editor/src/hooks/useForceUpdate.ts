import {useState} from "react";

export function useForceUpdate(): [number, (() => void)] {
    const [forceState, setValue] = useState(0);
    const forceUpdate = () => setValue(value => value + 1);
    return [forceState, forceUpdate];
}