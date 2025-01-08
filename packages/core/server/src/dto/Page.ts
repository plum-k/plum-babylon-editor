export class Page<T> {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;

    constructor(
        records: T[],
        total: number,
        size: number,
        current: number,
        pages: number,
    ) {
        this.records = records;
        this.total = total;
        this.size = size;
        this.current = current;
        this.pages = pages;
    }
}
