import {lazy} from "react";

const MenuRoutes = [
    {
        path: "/",
        name: '首页',
        component: lazy(() => import("../view/BabylonEdit.tsx")),
        icon: 'icon-icon'
    },
];

export default MenuRoutes;
