import {Course} from "./courses";

export interface Tutorial {
    title: string;      // title of the tutorial (Python types)
    course: Course;     // id of a course
    order: number;      // # in the course page
    pageId: string;     // notion pageId
}
