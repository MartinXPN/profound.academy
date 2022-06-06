import {useContext, useState} from "react";
import {AuthContext} from "../../App";
import {saveReply} from "../../services/forum";
import {TextField} from "@mui/material";


function Reply({commentId, onReplySaved}: { commentId: string, onReplySaved: () => void }) {
    const auth = useContext(AuthContext);
    const [replyText, setReplyText] = useState<string>('');

    if (!auth.currentUserId || !auth.currentUser || !auth.currentUser.displayName)
        return <></>;

    const onSave = async () => {
        if (!auth.currentUserId || !auth.currentUser || !auth.currentUser.displayName)
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
            variant="standard"
            onChange={event => setReplyText(event.target.value)}
            value={replyText}
            InputProps={{disableUnderline: true}}
            onKeyPress={async (ev) => {
               if (ev.key === 'Enter' && !ev.shiftKey) {
                   // Do code here
                   ev.preventDefault();
                   if( replyText.length > 0 )
                       await onSave();
               }
            }} />
    </>);
}

export default Reply;
