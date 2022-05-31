import {styled} from "@mui/material/styles";
import React, {useCallback, useContext, useState} from "react";
import AuthContext from "../user/AuthContext";
import {Course} from "models/courses";
import useAsyncEffect from "use-async-effect";
import {getCourse} from "../services/courses";
import LandingPage from "../home/LandingPage";
import Head from "next/head";
import CurrentCourseView, {CourseContext} from "../course/Course";
import {useRouter} from "next/router";


const Root = styled('div')({
    display: 'flex',
    height: 'calc(100vh - 64px)',
});


export default function CourseView() {
    const auth = useContext(AuthContext);
    const router = useRouter();
    const { courseId } = router.query;
    const [course, setCourse] = useState<Course | null>(null);
    const [error, setError] = useState<string | null>(null);

    useAsyncEffect(async () => {
        if( !courseId )
            return;
        const course = await getCourse(courseId as string);
        setCourse(course);
        setError(course ? null : 'You are not allowed to view the course. Please sign in or return to homepage');
    }, [courseId, auth]);

    const openPage = useCallback((pageId: string) => router.push(pageId), [router]);

    if( error )     return <LandingPage error={error} />
    if( !course )   return <></>
    return <>
        <Head>
            <title>{course.title}</title>
            <meta property="og:title" content={course.title} />
            <meta property="og:image" content={course.img} />
            <meta property="og:image:alt" content={course.title} />
            <meta property="og:type" content="article" />
        </Head>

        <CourseContext.Provider value={{course: course}}>
            <Root>
                <CurrentCourseView openPage={openPage} />
            </Root>
        </CourseContext.Provider>
    </>
}
