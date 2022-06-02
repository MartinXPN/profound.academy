import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
// import 'firebase/functions';
// import 'firebase/storage';


const prodConfig = {
    apiKey: "AIzaSyCoZzYEGYmfNgEwVN2thZcAmQ7NBqnzlBQ",
    authDomain: "profound.academy",
    projectId: "profound-academy",
    storageBucket: "profound-academy.appspot.com",
    messagingSenderId: "344681371914",
    appId: "1:344681371914:web:1f4967125a364c0c4e42f3",
    measurementId: "G-5EM92EE4GL",
}


const app = firebase.initializeApp(prodConfig);
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LcpsDAfAAAAAO04Nn88Eu88h7DldZGFu-OUrEN1'),
    // Optional argument. If true, the SDK automatically refreshes App Check tokens as needed.
    isTokenAutoRefreshEnabled: true
});
console.log('app check:', appCheck);


// configure the database to ignore undefined values
const db = firebase.firestore();
db.settings({ignoreUndefinedProperties: true});
db.enablePersistence().then(() => {
    console.log('Persistence is enabled!');
}).catch(e => {
    if( e.code === 'failed-precondition' )  console.error('Multiple open tabs');
    else if( e.code === 'unimplemented' )   console.error('Current browser does not support it');
});

const perf = getPerformance(app);
console.log('perf enabled:', perf.dataCollectionEnabled);

const analytics = getAnalytics(app);
console.log('analytics:', analytics);

// if (window.location.hostname === 'localhost') {
//     console.log('Using localhost => configuring the app to use emulators...');
//     const functions = firebase.functions();
//     const storage = firebase.storage();
//     const auth = firebase.auth();
//     auth.useEmulator('http://localhost:9099');
//     db.useEmulator('localhost', 8080);
//     functions.useEmulator('localhost', 5001);
//     storage.useEmulator('localhost', 9199);
// }
