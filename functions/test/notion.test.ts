import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {fetchNotionPage} from "../src/services/notion";

chai.use(chaiAsPromised);
const assert = chai.assert;


describe('Test Notion', function () {
    // Notion pages can take long to load
    this.timeout(5000);

    describe('Get notion pages', () => {
        it('Should fetch a valid notion page', async () => {
            const page = await fetchNotionPage('3dd92633b1ed4c1a83ea1203e51d5af7');
            await assert.containsAllKeys(page, ['block', 'signed_urls']);
            return true;
        });

        it('Should fail fetching an invalid page', async () => {
            return await assert.isRejected(fetchNotionPage('hello'), Error);
        });
    });
});
