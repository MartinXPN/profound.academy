import {Comment} from "../../models/forum";
import {Avatar, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";

function CommentView({comment}: {comment: Comment}) {
    return (<>
        <ListItem button key={comment.id}>
            <ListItemIcon>
                <Avatar alt={comment.displayName} src={comment.avatarUrl} />
            </ListItemIcon>
            <ListItemText
                primary={comment.displayName}
                secondary={comment.text} />
        </ListItem>
    </>)
}

export default CommentView;
