export interface Level {
    id: string;                                     // levelId
    title: string | {[key: string]: string};        // string or mapping {locale => titleText}
    score: number;                                  // total available score for the level
    exercises: number;                              // number of exercises in the level
}
