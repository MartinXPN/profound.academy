import {Course} from './courses';

export interface Activity {
    id: string;
    date: string;           // 2021-11-20
    count: number;          // how many problems were solved during that day
}

export interface User {
    id: string;
    courses?: Course[];
}
