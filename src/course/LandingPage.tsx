import React from "react";
import Content from "./content/Content";
import Button from "@material-ui/core/Button";

interface Props {
    introPageId: string;
    onStartCourseClicked: () => void;
}

function LandingPage(props: Props) {
    const { introPageId, onStartCourseClicked } = props;

    return (
        <>
            {introPageId && <Content notionPage={introPageId} />}
            <div style={{textAlign: 'center'}}>
                <Button color="primary" variant="contained" onClick={() => onStartCourseClicked()}>START THE COURSE</Button>
                {/*style={{ borderRadius: 50 }}*/}
            </div>
        </>
    )
}

export default LandingPage;
