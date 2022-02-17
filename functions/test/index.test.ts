import * as firebaseFunctionsTest from 'firebase-functions-test';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';

const assert = chai.assert;
const test = firebaseFunctionsTest();


describe('Test Hello world', () => {
    let allFunctions: typeof import('../src/index');
    let adminInitStub: sinon.SinonStub;

    before(async () => {
        admin.initializeApp(functions.config().firebase);
        adminInitStub = sinon.stub(admin, 'initializeApp');
        allFunctions = await import('../src/index');
        console.log('Done initializing!');
    });

    after(() => {
        adminInitStub.restore();
        test.cleanup();
    });

    describe('print', () => {
        it('shouldPrintHelloWorld', async () => {
            const response = {
                status: (code: number) => assert.equal(code, 200),
                send: (body: string) => assert.equal(body, 'Hello from Firebase!'),
            };
            // @ts-ignore
            allFunctions.helloWorld({}, response);
        });
    });
});
