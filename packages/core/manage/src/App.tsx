import {createBrowserRouter, RouterProvider} from "react-router";
import routerConfig from "./router/routerConfig.tsx";
import {Fragment, Suspense} from "react";
import {AntdThemeProvider} from "common";
import {Loading} from "./component/Loading/Loading.tsx";

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

