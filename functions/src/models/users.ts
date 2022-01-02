import {Course} from './courses';

export interface Activity {
    id: string;
    date: string;           // 2021-11-20
    count: number;          // how many problems were solved during that day
}

export interface Badge {
    id: string;
    title: string;
    imageUrl: string;
    description: string;
}

export interface User {
    id: string;
    imageUrl?: string;
    displayName?: string;
    badges?: Badge;
    courses?: Course[];
    completed?: Course[];
}

export interface UserInfoUpdate {
    id: string;
    imageUrl?: string;
    displayName?: string;
}
