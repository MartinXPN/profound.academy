import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import {config} from "./testConfig";

chai.use(chaiAsPromised);
const assert = chai.assert;


describe('Test Notion', function () {
    // Notion pages can take long to load
    this.timeout(5000);
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let notion: typeof import('../src/services/notion');

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        notion = await import('../src/services/notion');
    });

    afterEach(async () => {
        firestoreStub.restore();
        adminInitStub.restore();
    });

    describe('Get notion pages', () => {
        it('Should fetch a valid notion page', async () => {
            const page = await notion.fetchNotionPage('3dd92633b1ed4c1a83ea1203e51d5af7');
            await assert.containsAllKeys(page, ['block', 'signed_urls']);
            return true;
        });

        it('Should fail fetching an invalid page', async () => {
            return await assert.isRejected(notion.fetchNotionPage('hello'), Error);
        });
    });
});

describe('Test Caching', function () {
    // Notion pages can take long to load
    this.timeout(5000);
    let adminInitStub: sinon.SinonStub;
    let firestoreStub: sinon.SinonStub;
    let db: typeof import('../src/services/db').db;
    let notion: typeof import('../src/services/notion');
    const pageId = '3dd92633b1ed4c1a83ea1203e51d5af7';

    beforeEach(async () => {
        const app = admin.apps.length === 0 ? admin.initializeApp(config) : admin.apps[0] ?? undefined;
        adminInitStub = sinon.stub(admin, 'initializeApp');
        firestoreStub = sinon.stub(admin, 'firestore').callsFake(() => admin.firestore(app));
        notion = await import('../src/services/notion');
        db = (await import('../src/services/db')).db;
    });

    afterEach(async () => {
        db.notionPage(pageId).delete();
        firestoreStub.restore();
        adminInitStub.restore();
    });

    describe('Get and cache the notion page', () => {
        it('Should cache the notion page', async () => {
            const page = await notion.fetchNotionPage(pageId);

            await notion.cacheNotionPage(pageId, page);
            const cachedPage = await notion.getCachedPage(pageId);

            await assert.containsAllKeys(cachedPage, ['block', 'signed_urls']);
            return true;
        });
    });
});
