import {memo, useContext, useEffect, useState} from "react";
import {CodeDraft} from "../models/codeDrafts";
import useAsyncEffect from "use-async-effect";
import {CourseContext, CurrentExerciseContext} from "./Course";
import {getCodeDrafts} from "../services/codeDrafts";
import {Avatar, Badge, Grid, Stack, Typography, ListItemButton} from "@mui/material";
import {styled} from "@mui/material/styles";
import moment from "moment";


const LastUpdateBadge = styled(Badge)<{active: boolean}>(({theme, active}) => ({
    '& .MuiBadge-badge': {
        ...(active && {
            backgroundColor: '#44b700',
            color: '#44b700',
        }),
        ...(!active && {
            backgroundColor: 'rgba(80,80,80,0.70)',
            color: '#ffffff',
        }),
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        textColorPrimary: `${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '1px solid currentColor',
            ...(active && {animation: 'ripple 1.2s infinite ease-in-out'}),
            ...(active && {content: '""'}),
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));


function CodeDrafts({onCodeDraftSelected}: {
    onCodeDraftSelected?: (codeDraftId: string | null) => void,
}) {
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);

    const [codeDrafts, setCodeDrafts] = useState<CodeDraft[]>([]);
    const [currentDraft, setCurrentDraft] = useState<CodeDraft | null>(null);

    const onCodeDraftClicked = (codeDraft: CodeDraft) => {
        if( currentDraft?.id !== codeDraft.id ) {
            setCurrentDraft(codeDraft);
            onCodeDraftSelected && onCodeDraftSelected(codeDraft.id);
        }
        else {
            setCurrentDraft(null);
            onCodeDraftSelected && onCodeDraftSelected(null);
        }
    };

    useAsyncEffect(async () => {
        if( !course?.id || !exercise?.id )
            return;
        const fetchCodeDrafts = async () => {
            const codeDrafts = await getCodeDrafts(course.id, exercise.id);
            setCodeDrafts(codeDrafts);
        }

        await fetchCodeDrafts();
        return setInterval(async () => await fetchCodeDrafts(), 1000 * 60);

    }, (timeOutId) => timeOutId && clearInterval(timeOutId), [course?.id, exercise?.id, setCodeDrafts]);

    useEffect(() => {
        moment.defineLocale('short', {
            relativeTime: {
                future: 'in %s',
                past: '%s',
                s: (number, withoutSuffix) => withoutSuffix ? 'now' : 'a few seconds',
                m: '1m',
                mm: '%dm',
                h: '1h',
                hh: '%dh',
                d: '1d',
                dd: '%dd',
                M: '1mon',
                MM: '%dmon',
                y: '1y',
                yy: '%dy'
            }
        });
    }, []);

    return <>
        <Grid container justifyContent="center" padding={4} rowSpacing={4} columnSpacing={4}>
            {codeDrafts.map(codeDraft => {
                const isActive = new Date().getTime() - codeDraft.updatedAt.toDate().getTime() < 60 * 1000; /* updated at most one minute ago */
                return <Grid item key={codeDraft.id}>
                    <ListItemButton selected={currentDraft?.id === codeDraft.id}
                                    onClick={() => onCodeDraftClicked(codeDraft)}>
                        <Stack direction="column" alignItems="center" alignContent="center">
                            <LastUpdateBadge
                                overlap="circular"
                                variant={isActive ? 'dot' : 'standard'}
                                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                                active={isActive}
                                badgeContent={isActive ? "" : moment(codeDraft.updatedAt.toDate()).locale('short').fromNow()}>
                                <Avatar alt={codeDraft.userDisplayName} src={codeDraft.userImageUrl}/>
                            </LastUpdateBadge>

                            <Typography>{codeDraft.userDisplayName}</Typography>
                        </Stack>
                    </ListItemButton>
                </Grid>
            })}
        </Grid>
    </>;
}

export default memo(CodeDrafts);
