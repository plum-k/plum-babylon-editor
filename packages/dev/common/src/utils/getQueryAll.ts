const getQueryAll = () => {
    let queries: Record<any, any> = {};
    const query = window.location.search.substring(1);
    if (query === "") {
        return queries;
    }
    const vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        queries[pair[0]] = pair[1]
    }
    return queries;
}

export {getQueryAll};