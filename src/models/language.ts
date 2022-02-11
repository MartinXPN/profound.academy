export interface Language {
    extension: string;
    languageCode: string;
    displayName: string;
}

export const LANGUAGES: { [key: string]: Language } = {
    'txt': {extension: 'txt', languageCode: 'txt', displayName: 'Text'},
    // 'C': {extension: 'c', languageCode: 'C', displayName: 'C'}, // haven't added support in CodeRunner
    'C++11': {extension: 'cpp', languageCode: 'C++11', displayName: 'C++11'},
    'C++14': {extension: 'cpp', languageCode: 'C++14', displayName: 'C++14'},
    'C++17': {extension: 'cpp', languageCode: 'C++17', displayName: 'C++17'},
    // 'C++20': {extension: 'cpp', languageCode: 'C++20', displayName: 'C++20'}, not yet supported by our AWS lambda
    'python': {extension: 'py', languageCode: 'python', displayName: 'Python'},
    'python3': {extension: 'py', languageCode: 'python3', displayName: 'Python 3'},
};

export const LANGUAGE_KEYS = ['txt', 'C++11', 'C++14', 'C++17', 'python', 'python3'] as const;
