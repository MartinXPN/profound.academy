import React, {useContext, useState} from "react";
import {AuthContext} from "../../App";
import {saveReply} from "../../services/forum";
import {Button, TextField} from "@material-ui/core";
import {Save} from "@material-ui/icons";


function Reply({commentId, onReplySaved}: { commentId: string, onReplySaved: () => void }) {
    const auth = useContext(AuthContext);
    const [replyText, setReplyText] = useState<string>('');

    if (!auth || !auth.currentUser || !auth.currentUser.uid || !auth.currentUser.displayName)
        return <></>;

    const onSave = async () => {
        if (!auth || !auth.currentUser || !auth.currentUser.uid || !auth.currentUser.displayName)
            return;

        onReplySaved();
        await saveReply(
            commentId,
            auth.currentUser.uid, auth.currentUser.displayName, auth.currentUser?.photoURL,
            replyText
        );
    };

    return (<>
        <TextField required multiline fullWidth placeholder="Type your reply here..."
                   onChange={event => setReplyText(event.target.value)}
                   value={replyText}
                   InputProps={{disableUnderline: true}}/>

        {replyText.length > 0 && <Button size="small" endIcon={<Save/>} onClick={onSave}>Save</Button>}
    </>);
}

export default Reply;
