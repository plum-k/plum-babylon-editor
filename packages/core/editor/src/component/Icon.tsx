import {CSSProperties} from "react";
import classNames from 'classnames';

interface IConProps {
    iconName: string;
    className?: any;
    onClick?: () => void;
    style?: CSSProperties
}

export function Icon(props: IConProps) {
    const {iconName, className, onClick, style} = props;

    const _className = classNames("icon", className)

    return (
        <svg style={style} onClick={onClick} className={_className} aria-hidden="true">
            <use xlinkHref={`#${iconName}`}/>
        </svg>
    )
}