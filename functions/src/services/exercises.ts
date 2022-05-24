import * as AWS from 'aws-sdk';
import * as functions from 'firebase-functions';
import {PrivateTestsSummary} from '../models/exercise';


AWS.config.update({
    accessKeyId: functions.config().instructor.id,
    secretAccessKey: functions.config().instructor.key,
    region: 'us-east-1',
});
const TABLE = functions.config().tests.table;


export const getPrivateTestsSummary = async (exerciseId: string): Promise<PrivateTestsSummary> => {
    const dynamo = new AWS.DynamoDB();
    const params = {
        TableName: TABLE,
        Key: {
            id: {
                S: exerciseId,
            },
        },
    };
    const tests = await dynamo.getItem(params).promise();
    functions.logger.info(`Got tests: ${JSON.stringify(tests)}`);
    const res = tests.Item ? AWS.DynamoDB.Converter.unmarshall(tests.Item) : {id: exerciseId, count: 0, tests: []};
    functions.logger.info(`Therefore the result is: ${JSON.stringify(res)}`);
    return res as PrivateTestsSummary;
};
