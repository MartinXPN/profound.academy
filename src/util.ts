export const dateDayDiff = (d: Date, days: number): Date => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
};
export const tomorrow = (d: Date): Date => dateDayDiff(d, 1);
