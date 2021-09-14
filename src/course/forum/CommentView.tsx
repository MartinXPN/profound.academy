import {Avatar, ListItem, ListItemIcon, ListItemText, IconButton, Button, List} from "@material-ui/core";
import {Typography, TextField} from "@material-ui/core";
import {createStyles, makeStyles, Theme} from "@material-ui/core";
import {ArrowDropDown, ArrowDropUp, Edit, Save, Reply as ReplyIcon} from '@material-ui/icons';
import React, {useContext, useEffect, useState} from "react";
import {AuthContext} from "../../App";
import {Comment} from "../../models/forum";
import {onCommentRepliesChanged, updateComment} from "../../services/forum";
import Reply from "./Reply";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        content: {
            width: '100%',
        },
        score: {
            textAlign: 'center',
        },
        actions: {
            width: '100%',
            display: 'flex',
            overflow: 'hidden',
        },
        replies: {
            marginLeft: theme.spacing(2),
        },
    }),
);


function Score({score}: { score: number }) {
    const classes = useStyles();
    return (
        <div className={classes.score}>
            <IconButton><ArrowDropUp/></IconButton>
            <Typography>{score}</Typography>
            <IconButton><ArrowDropDown/></IconButton>
        </div>
    )
}


function CommentView({comment, allowReply}: {
    comment: Comment,
    allowReply: boolean
}) {
    const classes = useStyles();
    const auth = useContext(AuthContext);

    const [replies, setReplies] = useState<Comment[]>([]);
    const [showReplies, setShowReplies] = useState(false);
    const [showReply, setShowReply] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(comment.text);
    useEffect(() => {
        setText(comment.text);
    }, [comment]);

    useEffect(() => {
        if( !showReplies )
            return;

        const unsubscribe = onCommentRepliesChanged(comment.id, (replies) => {
            console.log('Got replies:', replies);
            replies && setReplies(replies);
        });
        return () => unsubscribe();
    }, [comment.id, showReplies]);

    const onShowReplies = () => setShowReplies(true);
    const onHideReplies = () => setShowReplies(false);
    const onReplyClicked = () => {
        setShowReplies(true);
        setShowReply(true);
    }
    const onReplySaved = () => setShowReply(false);

    const onEdit = () => setIsEditing(true);
    const onSave = async () => {
        await updateComment(comment.id, text);
        setIsEditing(false);
    }

    return (<>
        <ListItem key={comment.id}>
            <Score score={comment.score}/>
            <ListItemIcon>
                <Avatar alt={comment.displayName} src={comment.avatarUrl}/>
            </ListItemIcon>

            <div className={classes.content}>
                <ListItemText
                    primary={comment.displayName}
                    secondary={
                        <TextField
                            required multiline fullWidth
                            disabled={!isEditing}
                            placeholder="Start typing here..."
                            onChange={event => setText(event.target.value)}
                            value={text}
                            InputProps={{disableUnderline: true}}/>
                    }/>

                <div className={classes.actions}>
                    {allowReply && <Button size="small" onClick={onReplyClicked} startIcon={<ReplyIcon/>}>Reply</Button>}
                    {comment.replies.length > 0 &&
                    <>
                        {!showReplies &&
                        <Button endIcon={<ArrowDropDown/>} size="small" onClick={onShowReplies}>Show Replies</Button>}

                        {showReplies &&
                        <Button endIcon={<ArrowDropUp/>} size="small" onClick={onHideReplies}>Hide Replies</Button>}
                    </>}
                    {auth && auth.currentUser && comment.userId === auth.currentUser.uid && isEditing &&
                    <Button size="small" endIcon={<Save/>} onClick={onSave}>Save</Button>}
                    {auth && auth.currentUser && comment.userId === auth.currentUser.uid && !isEditing &&
                    <Button size="small" endIcon={<Edit/>} onClick={onEdit}>Edit</Button>}
                </div>

                {showReplies &&
                <List>
                    {replies.map(r => <CommentView comment={r} key={r.id} allowReply={false}/>)}
                </List>}

                {showReply && <Reply commentId={comment.id} onReplySaved={onReplySaved}/>}
            </div>

        </ListItem>
    </>)
}

export default CommentView;
