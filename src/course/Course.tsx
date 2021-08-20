import React, {useState} from "react";
import {useParams} from "react-router-dom";
import {getCourse} from "../services/courses";
import Content from "../content/Content";
import useAsyncEffect from "use-async-effect";
import {Course} from "../models/courses";

interface CourseParams {
    id: string;
}

function CourseView() {
    const [course, setCourse] = useState<Course | null>(null);
    const { id } = useParams<CourseParams>();

    useAsyncEffect(async () => {
        const course = await getCourse(id);
        setCourse(course);
    }, [id])
    return (
        <>
            {course && <Content notionPage={course.introduction} />}
        </>
    )
}

export default CourseView;
