import {HeaderTool,EditMenu,FileMenu} from "./";

export function Header() {
    return (
        <header className="relative  h-8 flex border-b shadow-sm">
            <div className="flex justify-center items-center ml-2 text-1xl font-bold">
                Plum
            </div>
            <div className="h-full flex items-center justify-center ml-3 text-2xl">
                <FileMenu/>
                <EditMenu/>
            </div>
            <HeaderTool/>
        </header>
    )
}
