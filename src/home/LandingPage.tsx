import {memo, lazy, Suspense} from "react";
import {Container, Link, Typography, useMediaQuery} from "@mui/material";
import Box from "@mui/material/Box";
import DiscordInvite from "./DiscordInvite";
import Feature, {MediaFeature} from "./Feature";
import {useTheme} from "@mui/material/styles";
const Product = lazy(() => import('../assets/Product'));
const Moon = lazy(() => import('../assets/Moon'));


function Header({onCoursesClicked}: {onCoursesClicked: () => void}) {
    const theme = useTheme();
    const largeScreen = useMediaQuery(theme.breakpoints.up('md'));

    return <>
        <Box bgcolor="secondary.main" position="relative" height={1000} maxHeight="calc(100vh - 64px)" minHeight={800} marginBottom={4}>
            <MediaFeature
                title={
                    <Typography variant="h1" color="white" fontWeight="bold" marginY={2}>
                        In-depth interactive courses
                    </Typography>
                }
                description={
                    <Typography variant="h3" color="white" fontSize={18} marginTop={2} marginBottom={4}>
                        Explore tailored programming courses that guide your learning journey from beginner to the advanced level.
                    </Typography>
                }
                media={<Suspense fallback={<></>}><Product width={largeScreen ? '100%' : 300} height={largeScreen ? '100%' : 300} /></Suspense>}
                mediaPosition="right"
                action="Explore Courses" onButtonClicked={onCoursesClicked} />

            <Container maxWidth="xl">
                <Box marginLeft={10} position="absolute" bottom={0} width={600} sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Suspense fallback={<></>}><Moon /></Suspense>
                </Box>
            </Container>
        </Box>
    </>
}


function LandingPage({onCoursesClicked, onPricingClicked}: {
    onCoursesClicked: () => void, onPricingClicked: () => void,
}) {

    return <>
        <Header onCoursesClicked={onCoursesClicked} />

        <Feature title="Learn Through Practice"
                 description={<>
                     <Typography whiteSpace="pre-wrap" marginBottom={2}>
                         Each concept in the computer science courses is explained through many interactive coding exercises that help you master the topic.
                         The curriculum is fully hands-on and interactive, so you make progress by solving various challenges and writing code instead of only consuming content.
                     </Typography>
                     <Typography fontWeight="bold" marginBottom={0}>??? Realtime feedback for each task.</Typography>
                     <Typography fontWeight="bold" marginBottom={2}>??? No installation - write code right in the browser.</Typography>
                 </>}
                 media="/demo/practice.mp4" mediaPosition="left"/>

        <Feature title="Free Tailored Courses"
                 description="Sign up for courses and start learning Python, Javascript and many other programming topics for free!
                 All the interactive courses are tailored to span various interests and cover a wide aspect of computer science topics.
                 Each course contains hands-on coding exercises of different difficulty levels to keep you engaged and motivated."
                 media="/demo/courses.mp4" mediaPosition="right"
                 action="Explore Courses" onButtonClicked={onCoursesClicked} to="#courses" />

        <Feature title="Group Tutoring"
                 description="Sign up for group tutoring sessions to get the benefit of a regular practice.
                 Learn programming consistently through weekly meetings and personalized guidance.
                 Group meetings take place at the time you pick, while you have the flexibility to participate in 2-3 weekly sessions."
                 media="/demo/group-tutoring.mp4" mediaPosition="left"
                 action="Learn More" onButtonClicked={onPricingClicked} to="/group-tutoring" />

        <DiscordInvite />

        <Feature title="Profound Academy for Learners"
                 description="Profound Academy provides tailored in-depth programming courses along with group tutoring sessions for consistent training.
                 Students have the flexibility of learning asynchronously - completely at their own pace.
                 Each concept is explained with a supplementary interactive exercise, where the platform provides instant feedback for each submission.
                 After submitting their code, students get instant feedback and can edit their solutions until finding the right answer."
                 media="/demo/individual.jpg" mediaPosition="right"
                 action="Explore Courses" onButtonClicked={onCoursesClicked} />

        <Feature title="Profound Academy for Institutions"
                 description={<>
                     <Typography whiteSpace="pre-wrap" marginBottom={2}>
                         Institutions and tutors can get the courses created by us to teach their students without creating every programming course from scratch.
                         All the content is customizable, so the tutors can adjust the courses to their needs.
                         Teachers can create courses with several clicks, while the platform automatically checks for solution correctness and provides instant feedback.
                     </Typography>
                     <Typography marginBottom={2}>
                         Please contact us at
                         <Link href="mailto:contact@profound.academy" target="_top"> contact@profound.academy </Link>
                         so that we can best help you get started.
                     </Typography>
                 </>}
                 media="/demo/institution.jpg" mediaPosition="left" />
    </>
}

export default memo(LandingPage);
