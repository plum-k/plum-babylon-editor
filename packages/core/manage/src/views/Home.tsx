import AddAppModalForm from "../component/AddAppModalForm.tsx";
import {ApplicationApi} from "common";
import {useEffect, useState} from "react";
import {Card} from "../component/Card.tsx";
import {IApplication} from "../interface/IApplication.ts";

export default function Home() {
    const [folders, setFolders] = useState<Array<IApplication>>([]);

    const getFolders = () => {
        ApplicationApi.getAll().then(res => {
            console.log(res)
            if (res.code === 1) {
                setFolders(res.data);
            }
        })
    }
    useEffect(() => {
        getFolders()
    }, []);

    return (
        <div className="bg-black/80 w-screen h-screen">
            <div
                className="bg-white w-3/5 h-3/5 top-0 left-0 bottom-0 right-0 m-auto fixed  border rounded-[0.5rem] shadow flex flex-col">
                <div className="border-b p-2">
                    <AddAppModalForm ok={getFolders}/>
                </div>
                <div className="p-4 overflow-hidden">
                    <div className="grid gap-4 grid-cols-4 overflow-auto h-full w-full">
                        {
                            folders.map((item, index) => {
                                return <Card reset={getFolders} item={item} key={index}/>
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

