import {Box, TextField} from "@mui/material";
import React, {memo} from "react";
import {Controller, useFormContext} from "react-hook-form";

function TextAnswerForm() {
    const {control, formState: {errors}} = useFormContext();

    return <>
        <Box marginBottom={5}>
            <Controller name="question" control={control} render={({ field: { ref, ...field } }) => (
                <TextField
                    required multiline fullWidth variant="outlined" placeholder="How would you do this?" label="Question"
                    error={Boolean(errors.question)} helperText={errors.question?.message}
                    inputRef={ref} {...field} />
            )}/>
        </Box>
    </>
}

export default memo(TextAnswerForm);
