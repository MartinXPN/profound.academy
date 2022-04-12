import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import * as chai from 'chai';
import {config} from "./testConfig";

const assert = chai.assert;


describe('Test Hello world', () => {
    let allFunctions: typeof import('../src/index');
    let adminInitStub: sinon.SinonStub;

    before(async () => {
        if (admin.apps.length === 0)
            admin.initializeApp(config);
        adminInitStub = sinon.stub(admin, 'initializeApp');
        allFunctions = await import('../src/index');
        console.log('Done initializing!');
    });

    after(() => {
        adminInitStub.restore();
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
