import {cn} from "common";
import {CSSProperties} from "react";

interface IConProps {
    iconName: string;
    className?: any;
    onClick?: () => void;
    style?: CSSProperties
}

export function Icon(props: IConProps) {
    const {iconName, className, onClick, style} = props;

    const _className = cn("icon", className)

    return (
        <svg style={style} onClick={onClick} className={_className} aria-hidden="true">
            <use xlinkHref={`#icon-${iconName}`}/>
        </svg>
    )
}