import React, {useCallback, useContext, useEffect, useState} from 'react';
import {IconButton, MenuItem, ListItemIcon, ListItemText, Badge, Avatar, Typography} from "@mui/material";
import Menu from '@mui/material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {AuthContext} from "../App";
import {Notification} from "models/notifications";
import {onNotificationsChanged, readNotification} from "../services/notifications";
import {useNavigate} from "react-router-dom";
import {Done} from "@mui/icons-material";


export default function AppBarNotifications() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const onNotificationClicked = useCallback(async (notification: Notification) => {
        if( !auth.currentUserId )
            return;
        await readNotification(auth.currentUserId, notification.id);
        navigate(notification.url);
    }, [auth.currentUserId, navigate]);

    useEffect(() => {
        if( !auth.currentUserId ) {
            setNotifications([]);
            return;
        }
        const unsubscribe = onNotificationsChanged(auth.currentUserId, (notifs) => {
            setUnreadNotifications(notifs.filter(n => !n.readAt).length);
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }, [auth.currentUserId]);

    if( !auth?.currentUser )
        return <></>

    return <>
        <IconButton onClick={handleMenu} edge="end" size="large" color="inherit" style={{marginRight: 10}}>
            <Badge badgeContent={unreadNotifications} color="info">
                <NotificationsIcon />
            </Badge>
        </IconButton>

        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    maxHeight: '80%',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.24))',
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>

            {notifications.length === 0 &&
            <MenuItem key="empty">
                <ListItemIcon><Done /></ListItemIcon>
                <ListItemText style={{marginLeft: 10}}>You're all caught up!</ListItemText>
            </MenuItem>}

            {notifications.map(n =>
            <MenuItem key={n.id} onClick={async () => await onNotificationClicked(n)}
                      style={{color: n.readAt ? 'grey' : 'inherit'}}>
                <ListItemIcon><Avatar src={n.imageUrl} /></ListItemIcon>
                <ListItemText style={{marginLeft: 10}}><Typography variant="inherit" noWrap>{n.message}</Typography></ListItemText>
            </MenuItem>
            )}
        </Menu>
    </>;
}
