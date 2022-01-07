import {memo, useContext, useState} from "react";
import {CodeDraft} from "../models/codeDrafts";
import useAsyncEffect from "use-async-effect";
import {CourseContext, CurrentExerciseContext} from "./Course";
import {getCodeDrafts} from "../services/codeDrafts";
import {Avatar, Badge, Grid, Stack, Typography, ListItemButton} from "@mui/material";
import {styled} from "@mui/material/styles";

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
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

        const codeDrafts = await getCodeDrafts(course.id, exercise.id);
        setCodeDrafts(codeDrafts);
    }, [course?.id, exercise?.id]);

    return <>
        <Grid container justifyContent="center" padding={4} rowSpacing={4} columnSpacing={4}>
            {codeDrafts.map(codeDraft => <Grid item key={codeDraft.id}>
                <ListItemButton selected={currentDraft?.id === codeDraft.id} onClick={() => onCodeDraftClicked(codeDraft)}>
                <Stack direction="column" alignItems="center" alignContent="center">
                    <StyledBadge
                        overlap="circular"
                        color="success"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        invisible={new Date().getTime() - codeDraft.updatedAt.toDate().getTime() > 60 * 1000 /* updated at most one minute ago */ }
                        badgeContent="">
                        <Avatar alt={codeDraft.userDisplayName} src={codeDraft.userImageUrl} />
                    </StyledBadge>

                    <Typography>{codeDraft.userDisplayName}</Typography>
                </Stack>
                </ListItemButton>
            </Grid>)}
        </Grid>
    </>;
}

export default memo(CodeDrafts);
