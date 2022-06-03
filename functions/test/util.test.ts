import * as chai from 'chai';
import {pathToObject} from '../src/services/util';

const assert = chai.assert;


describe('Check path to object', function () {
    it('Should create a proper object', () => {
        assert.deepEqual(pathToObject('a.b.c.d', 10), {a: {b: {c: {d: 10}}}});
    });
});
