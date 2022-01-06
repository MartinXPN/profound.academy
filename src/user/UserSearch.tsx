import * as React from 'react';
import {memo, useState, useEffect} from "react";
import {TextField, Autocomplete, Chip, Avatar, Box} from "@mui/material";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";
import {User} from "../models/users";
import useAsyncEffect from "use-async-effect";
import {getUsers, searchUser} from "../services/users";


function UserSearch({initialUserIds, onChange, sx}: {
    initialUserIds?: string[],
    onChange?: (users: User[]) => void,
    sx?: SxProps<Theme>
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<User[]>([]);
    const [currentSearch, setCurrentSearch] = useState<string | null>(null);
    const [options, setOptions] = useState<readonly User[]>([]);

    useAsyncEffect(async () => {
        if( !initialUserIds )
            return;

        setLoading(true);
        const users = await getUsers(initialUserIds);
        setCurrentSearch(null);
        setValue(users);
        setLoading(false);
    }, [initialUserIds]);

    useAsyncEffect(async () => {
        if( !currentSearch )
            return;

        setLoading(true);
        const userOptions = await searchUser(currentSearch, 20);
        setCurrentSearch(null);
        setOptions(userOptions);
        setLoading(false);
    }, [currentSearch]);


    useEffect(() => {
        if (!open)
            setOptions([]);
    }, [open]);


    return <>
        <Autocomplete
            id="tags-filled" multiple freeSolo
            sx={sx}

            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}

            options={options}
            getOptionLabel={(option) => option.displayName ?? ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={value}
            onChange={
                // @ts-ignore
                (e, value) => setValue(value)
            }
            loading={loading}
            renderTags={(value: User[], getTagProps) =>
                value.map((option, index: number) =>
                    <Chip
                        variant="outlined"
                        avatar={<Avatar alt={option.displayName} src={option.imageUrl} />}
                        label={option.displayName}
                        {...getTagProps({ index })} />
                )
            }
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                    <Chip
                        variant="outlined"
                        avatar={<Avatar alt={option.displayName} src={option.imageUrl} />}
                        label={option.displayName} />
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    value={currentSearch}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                    label="Instructors"
                    placeholder="Instructor users..."
                />
            )}
        />
    </>;
}

export default memo(UserSearch);
