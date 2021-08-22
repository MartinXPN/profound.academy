import Content from "./content/Content";
import React, {useState} from "react";
import {Tutorial} from '../models/tutorials';
import Button from "@material-ui/core/Button";
import {createStyles, makeStyles, Theme, Typography} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        tabChooser: {
            textAlign: 'center',
            padding: '10px'
        },
        button: {
            margin: theme.spacing(1),
            borderRadius: 50,
            size: 'large',
        },
    }),
);



interface TutorialProps {
    tutorial: Tutorial;
}

function TutorialView(props: TutorialProps) {
    const classes = useStyles();

    const {tutorial} = props;
    const [currentTab, setCurrentTab] = useState('description'); // {description / allSubmissions / bestSubmissions}

    return (
        <>
            <div className={classes.tabChooser}>
                <Button className={classes.button} variant={currentTab === 'description' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('description')}>Description</Button>
                <Button className={classes.button} variant={currentTab === 'bestSubmissions' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('bestSubmissions')}>Best Submissions</Button>
                <Button className={classes.button} variant={currentTab === 'allSubmissions' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('allSubmissions')}>All Submissions</Button>
            </div>


            {currentTab === 'description' && <Content notionPage={tutorial.pageId}/>}
            {currentTab === 'bestSubmissions' && <div>Best submissions</div>}
            {currentTab === 'allSubmissions' && <div>All submissions</div>}

            <br/><br/><br/>
            <Typography variant='h5'>The forum will appear here...</Typography>
        </>
    );
}

export default TutorialView;
