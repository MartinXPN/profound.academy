import * as functions from 'firebase-functions';
import {DynamoDBClient, GetItemCommand} from '@aws-sdk/client-dynamodb';
import {unmarshall} from '@aws-sdk/util-dynamodb';
import {PrivateTestsSummary} from '../models/exercise';


export const getPrivateTestsSummary = async (exerciseId: string): Promise<PrivateTestsSummary> => {
    const TABLE = functions.config().tests.table;
    const clientParams = {
        accessKeyId: functions.config().instructor.id,
        secretAccessKey: functions.config().instructor.key,
        region: 'us-east-1',
    };
    const client = new DynamoDBClient(clientParams);

    const params = {
        TableName: TABLE,
        Key: {
            id: {
                S: exerciseId,
            },
        },
    };
    const command = new GetItemCommand(params);
    const tests = await client.send(command);
    functions.logger.info(`Got tests: ${JSON.stringify(tests)}`);

    const res = tests.Item ? unmarshall(tests.Item) : {id: exerciseId, count: 0, tests: []};
    functions.logger.info(`Therefore the result is: ${JSON.stringify(res)}`);

    return res as PrivateTestsSummary;
};
