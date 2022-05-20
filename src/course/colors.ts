import {SubmissionStatus} from "models/submissions";

function adjust(color: string, amount: number) {
    return '#' + color.replace(/^#/, '')
                      .replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export const statusColors = {
    solved: '#1fb947',
    failed: '#F44336',
    neutral: '#fafafa',
    neutralText: '#212121',
    unavailable: '#969696',
};

export const statusToColor = (status: SubmissionStatus | string | null | undefined, isBackground: boolean = true) => {
    if (status === 'Solved')                return statusColors.solved;
    if (status === 'Wrong answer')          return statusColors.failed;
    if (status === 'Time limit exceeded')   return statusColors.failed;
    if (status === 'Memory limit exceeded') return statusColors.failed;
    if (status === 'Output limit exceeded') return statusColors.failed;
    if (status === 'Runtime error')         return statusColors.failed;
    if (status === 'Compilation error')     return statusColors.failed;
    if (status === 'Unavailable')           return statusColors.unavailable;
    // Checking and all other possible options
    return isBackground ? statusColors.neutral : statusColors.neutralText;
};

const getStyle = (color: string) => {
    const hoverColor = adjust(color, -10);
    const focusColor = adjust(color, -20);

    const selectedColor = adjust(color, -30);
    const selectedHoverColor = adjust(color, -40);
    return {
        background: color,
        '&:hover': {
            background: hoverColor,
        },
        '&:focus': {
            background: focusColor,
        },
        '&.Mui-selected': {
            backgroundColor: selectedColor,
            "&:hover": {
                backgroundColor: selectedHoverColor,
            },
        },
    }
};

export const statusToStyledBackground = {
    'Solved': getStyle(statusToColor('Solved')),
    'Wrong answer': getStyle(statusToColor('Wrong answer')),
    'Time limit exceeded': getStyle(statusToColor('Time limit exceeded')),
    'Memory limit exceeded': getStyle(statusToColor('Memory limit exceeded')),
    'Output limit exceeded': getStyle(statusToColor('Output limit exceeded')),
    'Runtime error': getStyle(statusToColor('Runtime error')),
    'Compilation error': getStyle(statusToColor('Compilation error')),
    'Checking': getStyle(statusToColor('Checking')),
    'Unavailable': getStyle(statusToColor('Unavailable')),
    null: getStyle(statusToColor(null)),
    undefined: getStyle(statusToColor(undefined)),
};
