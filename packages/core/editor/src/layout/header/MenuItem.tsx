export interface MenuProps {
    name: string,
    hotKey?: string,
    onClick?: () => void
}

export function MenuItem(props: MenuProps) {
    const {name, hotKey, onClick} = props;
    return (
        <div onClick={onClick}
             style={{
                 width: "100px",
                 justifyContent: "space-between",
                 display: "inline-flex",
             }}
        >
            <div>{name}</div>
            {
                hotKey ? <div>{hotKey}</div> : null
            }
        </div>
    )
}

