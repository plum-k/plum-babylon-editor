import {FC, Fragment, useEffect} from "react";
import {useViewer} from "../store";

const Test: FC = () => {
    const viewer = useViewer()
    useEffect(() => {
    }, [viewer])

    return (
        <Fragment>
        </Fragment>
    )
}

export default Test;
