import {Stack, TextField} from "@mui/material";
import {memo} from "react";
import {Controller, useFormContext} from "react-hook-form";

function TextAnswerForm() {
    const {control, formState: {errors}} = useFormContext();

    return <>
        <Stack marginBottom={5} direction="column" spacing={1}>
            <Controller name="question" control={control} render={({ field: { ref, ...field } }) => (
                <TextField
                    required multiline fullWidth variant="outlined" placeholder="How would you do this?" label="Question"
                    error={Boolean(errors.question)} helperText={errors.question?.message}
                    inputRef={ref} {...field} />
            )}/>

            <Controller name="answer" control={control} render={({ field: { ref, ...field } }) => (
                <TextField
                    required multiline fullWidth variant="outlined" placeholder="Simple..." label="Expected answer"
                    error={Boolean(errors.answer)} helperText={errors.answer?.message}
                    inputRef={ref} {...field} />
            )}/>

        </Stack>
    </>
}

export default memo(TextAnswerForm);
