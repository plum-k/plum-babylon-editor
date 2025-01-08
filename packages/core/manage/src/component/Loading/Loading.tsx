import {Fragment} from "react";
import "./style.css";

export interface ILoadingProps {
    spinning?: boolean;
}

export function Loading(props: ILoadingProps) {
    const {spinning} = {
        spinning: true,
        ...props
    };

    return (
        <Fragment>
            {
                spinning &&
                <div className={"loading-container"}>
                    <div className="loader">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            }
        </Fragment>
    )
}