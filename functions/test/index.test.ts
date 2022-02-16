import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';

const assert = chai.assert;
const test = require('firebase-functions-test')();

describe('Test Hello world', () => {
    let allFunctions: any, adminInitStub: sinon.SinonStub;

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
            }
            allFunctions.helloWorld({}, response);
        })
    })
});
