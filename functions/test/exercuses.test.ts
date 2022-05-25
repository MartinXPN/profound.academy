import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {getPrivateTestsSummary} from '../src/services/exercises';

chai.use(chaiAsPromised);
const assert = chai.assert;


describe('Test Exercise Private Tests', function () {
    this.timeout(5000);

    describe('Get private tests', () => {
        it('Should return valid tests', async () => {
            const res = await getPrivateTestsSummary('bdMTjO5rk19P8K5FzHIC');
            assert.isTrue(res.count > 10);
            assert.isTrue(res.tests.length === res.count);
        });

        it('Should return no tests', async () => {
            const res = await getPrivateTestsSummary('hello');
            assert.equal(res.count, 0, 'There should be 0 tests');
            assert.isEmpty(res.tests, 'There should be no tests');
        });
    });
});
