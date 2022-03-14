import {LANGUAGES} from './language';


export interface ExerciseType {
    id: string;
    displayName: string;
    description: string;
}

export const EXERCISE_TYPES: { [key: string]: ExerciseType } = {
    code: {id: 'code', displayName: 'Code',
        description: 'An exercise with predefined test cases (input/output or unittest)'},
    textAnswer: {id: 'textAnswer', displayName: 'Text answer',
        description: 'An exercise with a single correct text-based answer (can be a number as well)'},
    checkboxes: {id: 'checkboxes', displayName: 'Checkboxes',
        description: 'An exercise which has several correct answers'},
    multipleChoice: {id: 'multipleChoice', displayName: 'Multiple choice',
        description: 'An exercise with a single correct answer'},
};
export const COMPARISON_MODES = ['whole', 'token', 'custom'] as const;

export interface TestCase {
    input: string;
    target: string;
}

export interface SubtaskTestGroup {
    count: number;
    points: number;
    pointsPerTest: number;
}

export interface Exercise {
    id: string;
    title: string | {[key: string]: string};        // string or mapping {locale => titleText}
    pageId: string | {[key: string]: string};       // string or mapping {locale => pageId}
    order: number;
    score?: number;
    allowedAttempts?: number;
    exerciseType?: keyof typeof EXERCISE_TYPES;
    unlockContent?: string[],
    allowedLanguages?: (keyof typeof LANGUAGES)[];
    testCases: TestCase[];
    memoryLimit?: number;
    timeLimit?: number;
    outputLimit?: number;
    floatPrecision?: number;
    comparisonMode?: typeof COMPARISON_MODES[number];
    question?: string;
    options?: string[];
    testGroups?: SubtaskTestGroup[];
}

export interface ExercisePrivateFields {
    id: string;
    answer?: string;
}
