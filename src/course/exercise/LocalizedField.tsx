import React, {memo} from "react";
import {Autocomplete, Stack, TextField} from "@mui/material";
import Box from "@mui/material/Box";
import { notionPageToId } from "../../util";

import {Controller, useFormContext} from "react-hook-form";
import {infer as Infer, object, string} from "zod";


export const fieldSchema = object({
    locale: string().min(2).max(6),
    title: string().min(3).max(128),
    notionId: string().min(20).max(35),
});
export type FieldSchema = Infer<typeof fieldSchema>;


export function LocalizedField({allowedLocales, namePrefix}: { allowedLocales: string[], namePrefix?: string }) {
    const {control, formState: {errors}} = useFormContext();
    const getError = (path: string) => {
        if( path.includes('.') ) {
            const [rootName, index, fieldName] = path.split('.');
            return errors?.[rootName]?.[Number(index)]?.[fieldName];
        }
        return errors[path];
    }
    console.log(namePrefix);

    return <>
        <Stack direction="row" alignItems="top" alignContent="top">
            <Controller name={`${namePrefix}locale`} control={control} render={({field: {value, onChange, ...field}}) => (
                <Autocomplete
                    {...field}
                    multiple
                    limitTags={1}
                    sx={{ width: 150 }}
                    size="small"
                    options={allowedLocales}
                    getOptionLabel= {option => `${option.substring(0, 2)}-${option.substring(2, 4)}`}
                    isOptionEqualToValue={(option, value) => option.toLowerCase().replace('-', '') === value.toLowerCase().replace('-', '')}
                    autoHighlight
                    autoSelect
                    disableClearable
                    value={[value]}
                    renderOption={({ ...props}, option: string) => (
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                            <img loading="lazy" width={20} alt=""
                                 src={`https://flagcdn.com/w20/${option.substring(2, 4).toLowerCase()}.png`}
                                 srcSet={`https://flagcdn.com/w40/${option.substring(2, 4).toLowerCase()}.png 2x`}/>
                            {option.substring(0, 2)}-{option.substring(2, 4)}
                        </Box>
                    )}
                    renderTags={(options: string[], getTagProps) => options.map((option, index) => (
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...getTagProps({ index })}>
                            <img loading="lazy" width={20} alt=""
                                 src={`https://flagcdn.com/w20/${option.substring(2, 4).toLowerCase()}.png`}
                                 srcSet={`https://flagcdn.com/w40/${option.substring(2, 4).toLowerCase()}.png 2x`}/>
                            {option.substring(0, 2)}-{option.substring(2, 4)}
                        </Box>
                    ))}
                    renderInput={(params) => (
                        <TextField label="Language" {...params}
                                   error={Boolean(getError(`${namePrefix}locale`))}
                                   helperText={getError(`${namePrefix}locale`)?.message} />
                    )}
                    onChange={(e, value: string[]) => value.length && onChange(value.at(-1)!)}
                />
            )} />

            <Controller name={`${namePrefix}title`} control={control} render={({ field: { ref, ...field } }) => (
                <TextField required fullWidth label="Title" variant="outlined" size="small" placeholder="Exercise Title"
                           error={Boolean(getError(`${namePrefix}title`))} helperText={getError(`${namePrefix}title`)?.message}
                           inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>
            <Controller name={`${namePrefix}notionId`} control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField required fullWidth label="Notion page" variant="outlined" size="small" placeholder="Exercise Notion ID"
                           error={Boolean(getError(`${namePrefix}notionId`))} helperText={getError(`${namePrefix}notionId`)?.message}
                           onChange={(e) => onChange(notionPageToId(e.target.value))}
                           inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>
        </Stack>
    </>
}

export default memo(LocalizedField);
