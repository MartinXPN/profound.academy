# <img alt="Profound Academy logo" src="src/logo.svg" width="80"/> Profound Academy

[Profound Academy](https://profound.academy) is an educational platform with a primary focus on hands-on learning 
that enables teachers and course makers to easily create courses with rigorous practice exercises and tests. 
The aim of the platform is to save tutors’ time on homework checking 
and allow students to learn at their own pace while increasing their engagement throughout the learning process.


| Join the community                                                                                                                       | Visit Profound Academy   | Contact us                                                |
|------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|-----------------------------------------------------------|
| <a href="https://discord.gg/DfZMjQhK"><img src="https://www.vhv.rs/dpng/d/101-1013839_discord-join-hd-png-download.png" width="180"></a> | https://profound.academy | [support@pofound.academy](mailto:support@pofound.academy) |




# Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Available scripts include:
* `yarn start` Runs the app in the development mode
* `yarn test` Launches the test runner in the [interactive watch mode](https://facebook.github.io/create-react-app/docs/running-tests)
* `yarn build` Builds the app for production to the `build` folder
* `firebase deploy` Deploys the whole project to production (backend, frontend, Firestore, and rules)
* `firebase deploy --only hosting` Deploys the Rect app in the `build` folder to production
* `yarn update:models` Updates the models in the React app from `functions/src/models`

### Project structure
The project is organized as a mono-repo that includes both the front-end (React app) and the backend-end (Firebase serverless functions)
in one repository. Therefore, some things like models (schemas) are shared between those two major components to avoid replication.

```markdown
profound.academy
|
|-> firebase (includes firebase-specific files like Storage and Firestore rules and Firestore indexes)
|-> functions (firebase serverless functions)
        |-> test (includes tests for the serverless functions)
        |-> src (the main source code for functions)
             |-> models (all the models for both the front-end and the backend)
             |-> services (the main functionality of each endpoint)
             |-> index.ts (all the firebase functions endpoints)
|
|-> public (manifest, favicon, logo, etc)
|-> src (the main Rect app source code)
     |-> common (components and utilities)
     |-> course (components present in the course view including drawers, editor, exercise, forum, ranking, etc)
     |-> home (components present in the home page including footer, landing page, etc)
     |-> user (components for user view)
     |-> services (includes logic for reading and writing to firestore, connecting to firebase functions, uploading to S3, etc)
```
