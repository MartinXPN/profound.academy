export const dateDayDiff = (d: Date, days: number): Date => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
};

export const pathToObject = <T>(path: string, value: T): Record<string, unknown> => {
    const [first, ...parts] = path.split('.');
    if (parts.length === 0)
        return {[path]: value};
    return {[first]: pathToObject(parts.join('.'), value)};
};
