import {SubmissionStatus} from "../models/submissions";
import {makeStyles} from "@material-ui/core/styles";

function adjust(color: string, amount: number) {
    return '#' + color.replace(/^#/, '')
                      .replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export const statusColors = {
    solved: '#1fb947',
    failed: '#F44336',
    neutral: '#fafafa',
    unavailable: '#969696',
};

export const statusToColor = (status: SubmissionStatus | string | null | undefined) => {
    if (status === 'Solved')                return statusColors.solved;
    if (status === 'Wrong answer')          return statusColors.failed;
    if (status === 'Time limit exceeded')   return statusColors.failed;
    if (status === 'Runtime error')         return statusColors.failed;
    if (status === 'Compilation error')     return statusColors.failed;
    if (status === 'Checking')              return statusColors.neutral;
    if (status === 'Unavailable')           return statusColors.unavailable;
    return statusColors.neutral;
};

const getStyle = (color: string) => {
    const hoverColor = adjust(color, -10);
    const focusColor = adjust(color, -20);
    return {
        background: color,
        '&:hover': {
            background: hoverColor,
        },
        '&:focus': {
            background: focusColor,
        },
    }
};

export const useStatusToStyledBackground = makeStyles({
    'Solved': getStyle(statusToColor('Solved')),
    'Wrong answer': getStyle(statusToColor('Wrong answer')),
    'Time limit exceeded': getStyle(statusToColor('Time limit exceeded')),
    'Runtime error': getStyle(statusToColor('Runtime error')),
    'Compilation error': getStyle(statusToColor('Compilation error')),
    'Checking': getStyle(statusToColor('Checking')),
    'Unavailable': getStyle(statusToColor('Unavailable')),
    null: getStyle(statusToColor(null)),
    undefined: getStyle(statusToColor(undefined)),
});

export const useStatusToStyledColor = makeStyles({
    'Solved': {color: statusToColor('Solved')},
    'Wrong answer': {color: statusToColor('Wrong answer')},
    'Time limit exceeded': {color: statusToColor('Time limit exceeded')},
    'Runtime error': {color: statusToColor('Runtime error')},
    'Compilation error': {color: statusToColor('Compilation error')},
    'Checking': {color: statusToColor('Checking')},
    'Unavailable': {color: statusToColor('Unavailable')},
    null: {color: statusToColor(null)},
    undefined: {color: statusToColor(undefined)},
});
