import * as React from 'react';
import {memo, useState, useEffect} from "react";
import {TextField, Autocomplete, Chip, Avatar, Box} from "@mui/material";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";
import useAsyncEffect from "use-async-effect";
import {Course} from "../models/courses";
import {getCourses, searchCourses} from "../services/courses";


function CourseSearch({initialCourseIds, onChange, sx}: {
    initialCourseIds?: string[],
    onChange?: (courses: Course[]) => void,
    sx?: SxProps<Theme>
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<Course[]>([]);
    const [currentSearch, setCurrentSearch] = useState<string | null>(null);
    const [options, setOptions] = useState<readonly Course[]>([]);

    useAsyncEffect(async () => {
        if( !initialCourseIds )
            return;

        setLoading(true);
        const courses = await getCourses(initialCourseIds);
        setCurrentSearch(null);
        setValue(courses);
        setLoading(false);
    }, [initialCourseIds]);

    useAsyncEffect(async () => {
        if( !currentSearch || !currentSearch.length )
            return;

        setLoading(true);
        const courseOptions = await searchCourses(currentSearch, 20);
        setCurrentSearch(null);
        setOptions(courseOptions);
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
            getOptionLabel={(option) => option.title ?? ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={value}
            // @ts-ignore
            onChange={(e, value: Course[]) => {
                setValue(value);
                onChange && onChange(value);
            }}
            loading={loading}
            renderTags={(value: Course[], getTagProps) => value.map((option, index: number) =>
                <Chip
                    variant="outlined"
                    avatar={<Avatar alt={option.title} src={option.img}/>}
                    label={option.title}
                    {...getTagProps({index})} />
            )}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                    <Chip
                        variant="outlined"
                        avatar={<Avatar alt={option.title} src={option.img} />}
                        label={option.title} />
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    value={currentSearch}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                    label="Unlock Content"
                    placeholder="Courses..."
                />
            )}
        />
    </>;
}

export default memo(CourseSearch);
