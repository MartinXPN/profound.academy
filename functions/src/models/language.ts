export interface Language {
    extension: string;
    languageCode: string;
    displayName: string;
}

export const LANGUAGES: {[key: string]: Language} = {
    'C': {extension: 'c', languageCode: 'C', displayName: 'C'},
    'C++11': {extension: 'cpp', languageCode: 'C++11', displayName: 'C++11'},
    'C++14': {extension: 'cpp', languageCode: 'C++14', displayName: 'C++14'},
    'C++17': {extension: 'cpp', languageCode: 'C++17', displayName: 'C++17'},
    'C++20': {extension: 'cpp', languageCode: 'C++20', displayName: 'C++20'},
    'python': {extension: 'py', languageCode: 'python', displayName: 'Python'},
};
