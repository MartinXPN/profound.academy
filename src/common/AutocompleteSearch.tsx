import * as React from 'react';
import {memo, useState, useEffect} from "react";
import {TextField, Autocomplete, Chip, Avatar, Box} from "@mui/material";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";
import useAsyncEffect from "use-async-effect";


function AutocompleteSearch<T>({label, placeholder, search, idsToValues,
                                   optionToLabel, optionToId, optionToImageUrl,
                                   initialIds, onChange, sx}: {
    label: string,
    placeholder: string,
    search: (query: string, limit: number) => Promise<T[]>,
    idsToValues: (ids: string[]) => Promise<T[]>,
    optionToLabel: (option: T) => string,
    optionToId: (option: T) => string,
    optionToImageUrl: (option: T) => string,
    initialIds?: string[],
    onChange?: (values: T[]) => void,
    sx?: SxProps<Theme>
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentSearch, setCurrentSearch] = useState<string | null>(null);
    const [value, setValue] = useState<T[]>([]);
    const [options, setOptions] = useState<readonly T[]>([]);

    useAsyncEffect(async () => {
        if( !initialIds )
            return;

        setLoading(true);
        const values = await idsToValues(initialIds);
        setCurrentSearch(null);
        setValue(values);
        setLoading(false);
    }, [initialIds]);

    useAsyncEffect(async () => {
        if( !currentSearch )
            return;

        setLoading(true);
        const options = await search(currentSearch, 20);
        setCurrentSearch(null);
        setOptions(options);
        setLoading(false);
    }, [currentSearch]);


    useEffect(() => {
        if (!open)
            setOptions([]);
    }, [open]);


    return <>
        <Autocomplete
            multiple freeSolo
            sx={sx}

            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}

            options={options}
            getOptionLabel={optionToLabel}
            isOptionEqualToValue={(option, value) => optionToId(option) === optionToId(value)}
            value={value}
            // @ts-ignore
            onChange={(e, value: T[]) => {
                setValue(value);
                onChange && onChange(value);
            }}
            loading={loading}
            renderTags={(value: T[], getTagProps) => value.map((option, index: number) =>
                <Chip
                    variant="outlined" label={optionToLabel(option)}
                    avatar={<Avatar alt={optionToLabel(option)} src={optionToImageUrl(option)} />}
                    {...getTagProps({ index })} />
            )}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={optionToId(option)}>
                    <Chip
                        variant="outlined" label={optionToLabel(option)}
                        avatar={<Avatar alt={optionToLabel(option)} src={optionToImageUrl(option)} />} />
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    value={currentSearch}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                    label={label}
                    placeholder={placeholder}
                />
            )}
        />
    </>;
}

export default memo(AutocompleteSearch);
