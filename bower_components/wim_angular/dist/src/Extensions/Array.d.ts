interface Array<T> {
    group<T>(groupByProperty: string): {
        [id: string]: Array<T>;
    };
}
