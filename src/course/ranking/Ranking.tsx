import {memo, useContext, MouseEvent} from "react";
import {Grid} from "@mui/material";
import {CourseContext} from "../Course";
import RankingTable from "./RankingTable";
import ToggleButton from "@mui/material/ToggleButton";
import {styled} from "@mui/material/styles";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {useStickyState} from "../../common/stickystate";

const MetricButtonGroup = styled(ToggleButtonGroup)(({theme}) => ({
    '& .MuiToggleButtonGroup-grouped': {
        margin: theme.spacing(1),
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        border: 0,
        '&.Mui-disabled': {
            border: 0,
        },
        '&:not(:first-of-type)': {
            borderRadius: 50,
        },
        '&:first-of-type': {
            borderRadius: 50,
        },
    },
}));


function Ranking() {
    type METRICS = 'dailyScore' | 'weeklyScore' | 'monthlyScore' | 'score' | 'upsolveScore';
    const {course} = useContext(CourseContext);
    const [metric, setMetric] = useStickyState<METRICS>('score', `ranking-metric-${course?.id}`);
    const showUpsolving = course && course.freezeAt.toDate().getTime() < new Date().getTime();

    const handleChange = (event: MouseEvent<HTMLElement>, newValue: METRICS | null) => newValue && setMetric(newValue);

    return <>
        <Grid container justifyContent="center">
            <MetricButtonGroup value={metric} exclusive onChange={handleChange} color="primary">
                <ToggleButton value="dailyScore">1D</ToggleButton>
                <ToggleButton value="weeklyScore">7D</ToggleButton>
                <ToggleButton value="monthlyScore">30D</ToggleButton>
                {!showUpsolving && <ToggleButton value="score">ALL</ToggleButton>}
                {showUpsolving && <ToggleButton value="score">Contest</ToggleButton>}
                {showUpsolving && <ToggleButton value="upsolveScore">Upsolving</ToggleButton>}
            </MetricButtonGroup>
        </Grid>

        <RankingTable metric={metric} showProgress={metric !== 'score' && metric !== 'upsolveScore'} />
    </>
}

export default memo(Ranking);
