import {createBrowserRouter, RouteObject, RouterProvider} from "react-router-dom";
import {Fragment} from "react";
import BabylonEdit from "./view/BabylonEdit.tsx";

const routerConfig: RouteObject[] = [
    {
        path: '/',
        element: <BabylonEdit/>,
    }
]

export default function App() {
    const router = createBrowserRouter(routerConfig)

    return (
        <Fragment>
            <RouterProvider router={router}/>
        </Fragment>
    )
}

