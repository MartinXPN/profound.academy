# <img alt="Profound Academy logo" src="public/logo.svg" width="30"/> Profound Academy

[Profound Academy](https://profound.academy) is an educational platform that provides tailored courses for hands-on learning about computer science topics. Everything is hands-on and interactive, so the only way to make progress is by solving various challenges, instead of only consuming content.
Students seeking a regular learning schedule can sign up for our group tutoring sessions, which is especially useful for increasing the chances of actually completing the course.

🤔 Did you know that the completion rate of an online computer science course is ~5%?

So, ~95% of people don’t get to the end of the course and drop it as soon as they reach a challenging topic.

We try to fix that problem by providing tutoring sessions that help people get unstuck and progress faster.


| Join the community                                                                                  | Visit Profound Academy   | Contact us                                                |
|-----------------------------------------------------------------------------------------------------|--------------------------|-----------------------------------------------------------|
| <a href="https://discord.gg/TTTEcu2Jju"><img src="https://i.imgur.com/YSRtCwE.png" width="180"></a> | https://profound.academy | [support@pofound.academy](mailto:support@pofound.academy) |




# Development

### Prerequisites
To run the firebase functions `.runtimeconfig.json` needs to be present in the project root and `functions/` directories.
It should contain AWS IAM role ID and private key with permissions to write to S3 and to read from a DynamoDB table.
* S3 permissions need to be present to generate signed-url when uploading private `.zip` test cases to S3.
* DynamoDB table name should be present to retrieve private test summary for exercises.
```json
{
  "instructor": {
    "id": "XXXXXXXXXXXXXXXXXXXX",
    "key": "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK"
  },
  "tests": {
    "table": "LambdaJudge-PrivateTestsTable-XXXXXX"
  },
  "host": "local" // <--- optional to indicate local execution
}
```

### Running the project
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Available scripts include:
* `yarn start` Runs the app in the development mode
* `yarn test` Launches the test runner in the [interactive watch mode](https://facebook.github.io/create-react-app/docs/running-tests)
* `yarn build` Builds the app for production to the `build` folder
* `firebase deploy` Deploys the whole project to production (backend, frontend, Firestore, and rules)
* `firebase deploy --only hosting` Deploys the Rect app in the `build` folder to production
* `yarn update:models` Updates the models in the React app from `functions/src/models`
* ` lsof -t -i tcp:5000 | xargs kill &&  lsof -t -i tcp:5001 | xargs kill &&  lsof -t -i tcp:9099 | xargs kill &&  lsof -t -i tcp:8080 | xargs kill &&  lsof -t -i tcp:9199 | xargs kill &&  lsof -t -i tcp:8087 | xargs kill # firebase kill all emulators` Kills all firebase emulators and frees up ports

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
