import {useCallback, useContext, useEffect, useState} from "react";
import {Avatar, ListItem, ListItemIcon, ListItemText, IconButton, Button, List, MenuItem, Stack} from "@mui/material";
import {Typography, TextField} from "@mui/material";
import {ArrowDropDown, ArrowDropUp, Edit, Save, Reply as ReplyIcon, Delete} from '@mui/icons-material';
import {AuthContext} from "../../App";
import {Comment} from "models/forum";
import {deleteComment, onCommentRepliesChanged, updateComment, vote} from "../../services/forum";
import Reply from "./Reply";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Menu from "@mui/material/Menu";
import {useNavigate} from "react-router-dom";
import moment from "moment";
import Box from "@mui/material/Box";
import {styled} from "@mui/material/styles";

const UserName = styled(Typography)({
    '&:focus,&:hover': {cursor: 'pointer'},
});


function Score({commentId, score}: { commentId: string, score: number }) {
    const auth = useContext(AuthContext);

    const upVote = async () => auth && auth.currentUser && auth.currentUser.uid && await vote(commentId, auth.currentUser.uid, 1);
    const downVote = async () => auth && auth.currentUser && auth.currentUser.uid && await vote(commentId, auth.currentUser.uid, -1);

    return (
        <Box textAlign="center">
            <IconButton onClick={upVote} size="large"><ArrowDropUp/></IconButton>
            <Typography>{score}</Typography>
            <IconButton onClick={downVote} size="large"><ArrowDropDown/></IconButton>
        </Box>
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
    const navigate = useNavigate();
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

        const unsubscribe = onCommentRepliesChanged(comment.id, replies => replies && setReplies(replies));
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
    const onDelete = useCallback(async () => await deleteComment(comment.id), [comment.id]);
    const onUserClicked = useCallback((userId: string) => navigate(`/users/${userId}`), [navigate]);

    return <>
        <ListItem key={comment.id} alignItems="flex-start">
            <Box display="flex">
                <Box margin="auto"><Score commentId={comment.id} score={comment.score} /></Box>
                <ListItemIcon sx={{margin: 'auto'}}>
                    <Avatar alt={comment.displayName} src={comment.avatarUrl}/>
                </ListItemIcon>
            </Box>

            <Box width="100%">
                <ListItemText
                    primary={
                        <Stack direction="row" alignItems="center">
                            <UserName onClick={() => onUserClicked(comment.userId)}>{comment.displayName}</UserName>
                            <Typography variant="body2" color="text.secondary" noWrap>&nbsp; • &nbsp;</Typography>
                            <Typography variant="body2" color="text.secondary">{comment.createdAt ? moment(comment.createdAt.toDate()).locale('en').fromNow() : 'just now'}</Typography>
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

                <Box width="100%" display="flex" overflow="hidden">
                    {allowReply &&
                    <Button size="small" onClick={onReplyClicked} startIcon={<ReplyIcon/>} sx={{textTransform: 'none'}}>Reply</Button>}
                    {comment.replies.length > 0 &&
                    <>
                        {!showReplies &&
                        <Button endIcon={<ArrowDropDown/>} size="small" onClick={onShowReplies} sx={{textTransform: 'none'}}>Show replies ({comment.replies.length})</Button>}

                        {showReplies &&
                        <Button endIcon={<ArrowDropUp/>} size="small" onClick={onHideReplies} sx={{textTransform: 'none'}}>Hide replies</Button>}
                    </>}
                    {auth && auth.currentUser && comment.userId === auth.currentUser.uid && isEditing &&
                    <Button size="small" endIcon={<Save/>} onClick={onSave}>Save</Button>}
                </Box>

                {showReplies &&
                <List>
                    {replies.map(r => <CommentView comment={r} key={r.id} allowReply={false}/>)}
                </List>}

                {showReply && <Reply commentId={comment.id} onReplySaved={onReplySaved}/>}
            </Box>

        </ListItem>
    </>;
}

export default CommentView;
