export interface Level {
    id: string;                                     // levelId
    title: string | {[key: string]: string};        // string or mapping {locale => titleText}
}
