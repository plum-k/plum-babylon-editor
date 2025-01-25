import {createBrowserRouter, RouterProvider} from "react-router";
import {Fragment, lazy, Suspense} from "react";
import {AntdThemeProvider, Loading} from "./component";
import {RouteObject} from "react-router-dom";

const Home = lazy(() => import("./view/Home.tsx"))
const Editor = lazy(() => import('./view/Editor.tsx'))
const Preview = lazy(() => import('./view/Preview.tsx'))
export const routerConfig: RouteObject[] = [
    {
        path: '/',
        // errorElement: <ErrorBoundary />,
        element: <Home/>,
    },
    {
        path: '/editor/:appId',
        element: <Editor/>
    },
    {
        path: '/preview/:appId',
        element: <Preview/>
    },
]

export default function App() {
    const router = createBrowserRouter(routerConfig)
    return (
        <Fragment>
            <AntdThemeProvider>
                <Suspense fallback={<Loading/>}>
                    <RouterProvider router={router}/>
                </Suspense>
            </AntdThemeProvider>
        </Fragment>
    )
}