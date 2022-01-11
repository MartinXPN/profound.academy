import React, {memo, useState} from "react";
import Box from "@mui/material/Box";
import {Stack, TextField, Typography} from "@mui/material";

interface Params {
    dirty: boolean;
    values: { [key: string]: string | number | undefined };
}

function ExecutionParameters({initialParams, setParams}: {
    initialParams: Params,
    setParams: (params: Params) => void,
}) {
    // TODO:
    //  1. add validation and setParams at the right time
    //  2. add <List><TransitionGroup><Collapse> with add option to add custom execution params
    const [memoryLimit, setMemoryLimit] = useState<number>(initialParams.values['memoryLimit'] && typeof initialParams.values['memoryLimit'] === 'number' ? initialParams.values['memoryLimit'] : 512);
    const [timeLimit, setTimeLimit] = useState<number>(initialParams.values['timeLimit'] && typeof initialParams.values['timeLimit'] === 'number' ? initialParams.values['timeLimit'] : 2);

    return <>
        <Box>
            <Typography variant="h6" marginBottom={2}>Execution Parameters</Typography>
            <Stack direction="row" spacing={1}>
                <TextField required variant="outlined" placeholder="512" type="number" label="Memory limit (MB)"
                           value={memoryLimit} onChange={e => setMemoryLimit(Number(e.target.value))}
                           inputProps={{ 'aria-label': 'controlled', inputMode: 'numeric', pattern: '[0-9.]*' }} sx={{flex: 1}}/>

                <TextField required variant="outlined" placeholder="2" type="number" label="Time limit (s)"
                           value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
                           inputProps={{ 'aria-label': 'controlled', inputMode: 'numeric', pattern: '[0-9.]*' }} sx={{flex: 1}}/>
            </Stack>
        </Box>
    </>
}

export default memo(ExecutionParameters);
