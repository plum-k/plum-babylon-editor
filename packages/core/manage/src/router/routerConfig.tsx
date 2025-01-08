import {RouteObject} from "react-router-dom";
// import {BabylonEdit} from "@plum-render/babylon-editor";
import {lazy} from "react";

const Home = lazy(() => import('../views/Home.tsx'))
const BabylonEdit = lazy(() => import('../../../editor/src/view/BabylonEdit.tsx'))

const routerConfig: RouteObject[] = [
    {
        path: '/',
        // errorElement: <ErrorBoundary />,
        element: <Home/>,
    },
    {
        path: '/babylon-edit/:appId',
        element: <BabylonEdit/>
    },
    // {
    //     path: '*',
    //     element: <NoFind />
    // }
]

export default routerConfig;