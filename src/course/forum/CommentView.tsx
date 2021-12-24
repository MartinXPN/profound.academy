import {Avatar, ListItem, ListItemIcon, ListItemText, IconButton, Button, List, MenuItem, Stack} from "@mui/material";
import {Typography, TextField} from "@mui/material";
import { Theme } from "@mui/material";
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import {ArrowDropDown, ArrowDropUp, Edit, Save, Reply as ReplyIcon, Delete} from '@mui/icons-material';
import React, {useCallback, useContext, useEffect, useState} from "react";
import {AuthContext} from "../../App";
import {Comment} from "../../models/forum";
import {deleteComment, onCommentRepliesChanged, updateComment, vote} from "../../services/forum";
import Reply from "./Reply";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Menu from "@mui/material/Menu";
import {styled} from "@mui/styles";
import {useHistory} from "react-router-dom";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        userHeader: {
            display: 'flex',
        },
        userHeaderItem: {
            margin: 'auto',
        },
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
        button: {
            textTransform: 'none'
        },
    }),
);

const UserName = styled(Typography)({
    '&:focus,&:hover': {cursor: 'pointer'},
});


function Score({commentId, score}: { commentId: string, score: number }) {
    const classes = useStyles();
    const auth = useContext(AuthContext);

    const upVote = async () => auth && auth.currentUser && auth.currentUser.uid && await vote(commentId, auth.currentUser.uid, 1);
    const downVote = async () => auth && auth.currentUser && auth.currentUser.uid && await vote(commentId, auth.currentUser.uid, -1);

    return (
        <div className={classes.score}>
            <IconButton onClick={upVote} size="large"><ArrowDropUp/></IconButton>
            <Typography>{score}</Typography>
            <IconButton onClick={downVote} size="large"><ArrowDropDown/></IconButton>
        </div>
    );
}

function CommentEditing({onEditClicked, onDeleteClicked}: {onEditClicked: () => void, onDeleteClicked: () => void}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    return <>
        <IconButton
            onClick={handleMenu}
            edge="end"
            size="small">
            <MoreHorizIcon/>
        </IconButton>

        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.24))',
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>

            <MenuItem onClick={onEditClicked}>
                <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={onDeleteClicked}>
                <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
            </MenuItem>
        </Menu>
    </>
}


function CommentView({comment, allowReply}: {
    comment: Comment,
    allowReply: boolean
}) {
    const classes = useStyles();
    const history = useHistory();
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
    const onReplySaved = () => setShowReply(false);
    const onReplyClicked = () => {
        setShowReplies(true);
        setShowReply(true);
    }

    const onEdit = useCallback(() => setIsEditing(true), []);
    const onSave = useCallback(async () => {
        await updateComment(comment.id, text);
        setIsEditing(false);
    }, [comment.id, text]);
    const onDelete = useCallback(async () => {
        await deleteComment(comment.id);
        console.log('Removed the comment!!');
    }, [comment.id]);

    const onUserClicked = useCallback((userId: string) => {
        history.push(`/users/${userId}`);
    }, [history]);

    return <>
        <ListItem key={comment.id} alignItems="flex-start">
            <div className={classes.userHeader}>
                <div className={classes.userHeaderItem}><Score commentId={comment.id} score={comment.score} /></div>
                <ListItemIcon className={classes.userHeaderItem}>
                    <Avatar alt={comment.displayName} src={comment.avatarUrl}/>
                </ListItemIcon>
            </div>

            <div className={classes.content}>
                <ListItemText
                    primary={
                        <Stack direction="row" alignItems="center">
                            <UserName onClick={() => onUserClicked(comment.userId)}>{comment.displayName}</UserName>
                            {auth && auth.currentUser && comment.userId === auth.currentUser.uid && !isEditing &&
                            <CommentEditing onEditClicked={onEdit} onDeleteClicked={onDelete} />}
                        </Stack>
                    }
                    secondary={
                        <div style={{display: 'flex'}}>
                        <TextField
                            variant="standard"
                            required multiline fullWidth
                            disabled={!isEditing}
                            placeholder="Start typing here..."
                            onChange={event => setText(event.target.value)}
                            value={text}
                            InputProps={{disableUnderline: true}} />
                        </div>
                    }/>

                <div className={classes.actions}>
                    {allowReply &&
                    <Button size="small" onClick={onReplyClicked} startIcon={<ReplyIcon/>} className={classes.button}>Reply</Button>}
                    {comment.replies.length > 0 &&
                    <>
                        {!showReplies &&
                        <Button endIcon={<ArrowDropDown/>} size="small" onClick={onShowReplies} className={classes.button}>Show replies ({comment.replies.length})</Button>}

                        {showReplies &&
                        <Button endIcon={<ArrowDropUp/>} size="small" onClick={onHideReplies} className={classes.button}>Hide replies</Button>}
                    </>}
                    {auth && auth.currentUser && comment.userId === auth.currentUser.uid && isEditing &&
                    <Button size="small" endIcon={<Save/>} onClick={onSave}>Save</Button>}
                </div>

                {showReplies &&
                <List>
                    {replies.map(r => <CommentView comment={r} key={r.id} allowReply={false}/>)}
                </List>}

                {showReply && <Reply commentId={comment.id} onReplySaved={onReplySaved}/>}
            </div>

        </ListItem>
    </>;
}

export default CommentView;
