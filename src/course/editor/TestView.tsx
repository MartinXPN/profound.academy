import {TestCase} from "../../models/courses";
import {makeStyles, Typography} from "@material-ui/core";

const useStyles = makeStyles({
    bold: {
        fontWeight: 'bold',
    },
})


interface Props {
    testCase: TestCase;
    output?: string;
}

function TestView(props: Props) {
    const classes = useStyles();
    const {testCase, output} = props;

    return (
        <>
            <Typography className={classes.bold}>Input:</Typography>
            <Typography>{testCase.input}</Typography>

            <br/>
            <Typography className={classes.bold}>Expected output:</Typography>
            <Typography>{testCase.target}</Typography>

            <br/>
            {output && <>
                <Typography className={classes.bold}>Program output:</Typography>
                <Typography>{output}</Typography>
            </>}
        </>
    );
}

export default TestView;
