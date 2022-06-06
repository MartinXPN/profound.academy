import {memo} from "react";
import {Button, IconButton, List, ListItem, Checkbox, Stack, TextField} from "@mui/material";
import {Controller, useFormContext} from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

const SEP = '﻿\n';

function CheckboxesForm() {
    const {control, watch, formState: {errors}, setValue} = useFormContext();
    const options: string[] | undefined = watch('options');
    const answer = watch('answer');

    const remove = (index: number) => setValue('options', options ? options.filter((option, i) => i !== index) : undefined, {shouldTouch: true});
    const append = () => setValue('options', options ? [...options, ''] : [''], {shouldTouch: true});
    const update = (index: number, value: string) => {
        const copy = options ? [...options] : [];
        copy[index] = value;
        setValue('options', copy, {shouldTouch: true});
    }

    const updateAnswer = (prevItem?: string, curItem?: string) => {
        let ans = answer ? answer.split(SEP) : [];
        ans = ans.filter((val: string) => val !== prevItem && options && options.includes(val));
        curItem && ans.push(curItem);
        ans.sort();
        ans = ans.join(SEP);
        setValue('answer', ans, {shouldTouch: true});
    }

    return <>
        <Stack marginBottom={5} direction="column" spacing={1}>
            <Controller name="question" control={control} render={({ field: { ref, ...field } }) => (
                <TextField
                    required multiline fullWidth variant="outlined" placeholder="How would you do this?" label="Question"
                    error={Boolean(errors.question) || Boolean(errors.answer)}
                    helperText={errors.question?.message ?? (errors.answer?.message ? ('Answer: ' + errors.answer?.message) : null)}
                    inputRef={ref} {...field} />
            )}/>

            <List>
                {options && options.map((item, index) => (
                    <ListItem
                        key={index} sx={{maxWidth: 400}}
                        secondaryAction={<IconButton edge="end" title="Delete" onClick={() => remove(index)}><CloseIcon /></IconButton>}>

                        <Checkbox
                            checked={!!answer && answer.includes(item)}
                            onChange={e => e.target.checked ? updateAnswer(undefined, item) : updateAnswer(item)} />
                        <TextField
                            required multiline fullWidth
                            variant="standard" placeholder={`Option ${index + 1}`}
                            value={item}
                            onChange={e => {
                                if( answer && answer.includes(item) )
                                    updateAnswer(item, e.target.value);
                                update(index, e.target.value);
                            }}
                            error={Boolean(errors.options?.[index])} helperText={errors.options?.[index]?.message} />
                    </ListItem>
                ))}
                <Button key="add" sx={{textTransform: 'none', marginLeft: 2}} startIcon={<AddIcon/>} onClick={append}>Add an option</Button>
            </List>
        </Stack>
    </>
}

export default memo(CheckboxesForm);
