import React, {useContext, useState} from "react";
import {useParams} from "react-router-dom";
import {getCourse, startCourse} from "../services/courses";
import useAsyncEffect from "use-async-effect";
import {Course} from "../models/courses";
import LandingPage from "./LandingPage";
import {AuthContext} from "../App";
import SplitPane from 'react-split-pane';
import {Tutorial} from "../models/tutorials";
import {getCourseTutorials} from "../services/tutorials";
import Auth from "../header/Auth";
import Editor from "./Editor";
import TutorialView from "./Tutorial";

interface CourseParams {
    id: string;
}

function CourseView() {
    const {id} = useParams<CourseParams>();
    const auth = useContext(AuthContext);
    const [showSignIn, setShowSignIn] = useState(false);
    const pageKey = `progress-${auth?.currentUser?.uid}-${id}`;
    const [pageId, setPageId] = useState(auth?.currentUser ? localStorage.getItem(pageKey) : null);

    const [course, setCourse] = useState<Course | null>(null);
    const [tutorials, setTutorials] = useState<Tutorial[] | null>(null);
    const currentTutorial = course && pageId && tutorials && tutorials[parseInt(pageId)] ? tutorials[parseInt(pageId)] : null;

    useAsyncEffect(async () => {
        const course = await getCourse(id);
        setCourse(course);
    }, [id]);

    useAsyncEffect(async () => {
        const tutorials = await getCourseTutorials(id);
        setTutorials(tutorials);
    }, [id]);


    return (
        <>
            {/* Display the landing page with an option to start the course if it wasn't started yet */}
            {course && !pageId && <><LandingPage introPageId={course.introduction} onStartCourseClicked={() => {
                if (auth && auth.currentUser && auth.currentUser.uid) {
                    startCourse(auth.currentUser.uid, id).then(() => console.log('success'));
                    localStorage.setItem(pageKey, '0');
                    setPageId('0');
                } else {
                    setShowSignIn(true);
                }
            }}/>
            </>}

            {/* Display the tutorial of the course at the location where it was left off the last time*/
                currentTutorial &&
                <SplitPane split='vertical'
                           primary='first'
                           style={{overflow: 'hidden'}}
                           defaultSize={parseInt(localStorage.getItem('splitPos') ?? '50', 10)}
                           onChange={(size) => localStorage.setItem('splitPos', size.toString(10))}>

                    <div style={{overflowX: 'hidden' ,overflowY: 'scroll'}}>
                    <TutorialView tutorial={currentTutorial} />
                    </div>
                    <div style={{marginTop: '80px', width: '100%'}}><Editor/></div>
                </SplitPane>
            }
            <Auth showSignInOptions={showSignIn}/>
        </>
    )
}

export default CourseView;
