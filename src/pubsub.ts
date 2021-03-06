import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as Redis from 'ioredis';
import * as path from 'path';
import { ActivityLogs, Conversations } from './db/models';
import { get, redisOptions, set } from './redisClient';

// load environment variables
dotenv.config();

interface IPubSub {
  asyncIterator: <T>(trigger: string, options?: any) => AsyncIterator<T>;
  publish(trigger: string, payload: any, options?: any): any;
}

interface IPubsubMessage {
  action: string;
  data: {
    trigger: string;
    type: string;
    payload: any;
  };
}

interface IGoogleOptions {
  projectId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

const { PUBSUB_TYPE, NODE_ENV, PROCESS_NAME } = process.env;

// Google pubsub message handler
const commonMessageHandler = payload => {
  return convertPubSubBuffer(payload.data);
};

const configGooglePubsub = (): IGoogleOptions => {
  const checkHasConfigFile = fs.existsSync(path.join(__dirname, '..', '/google_cred.json'));

  if (!checkHasConfigFile) {
    throw new Error('Google credentials file not found!');
  }

  const serviceAccount = require('../google_cred.json');

  return {
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
  };
};

const createPubsubInstance = (): IPubSub => {
  let pubsub;

  if (NODE_ENV === 'test' || NODE_ENV === 'command' || PROCESS_NAME === 'crons') {
    pubsub = {
      asyncIterator: () => null,
      publish: () => null,
    };

    return pubsub;
  }

  if (PUBSUB_TYPE === 'GOOGLE') {
    const googleOptions = configGooglePubsub();

    const GooglePubSub = require('@axelspringer/graphql-google-pubsub').GooglePubSub;

    const googlePubsub = new GooglePubSub(googleOptions, undefined, commonMessageHandler);

    googlePubsub.subscribe('widgetNotification', message => {
      publishMessage(message);
    });

    pubsub = googlePubsub;
  } else {
    const redisPubSub = new RedisPubSub({
      connectionListener: error => {
        if (error) {
          console.error(error);
        }
      },
      publisher: new Redis(redisOptions),
      subscriber: new Redis(redisOptions),
    });

    redisPubSub.subscribe('widgetNotification', message => {
      return publishMessage(message);
    });

    pubsub = redisPubSub;
  }

  return pubsub;
};

const publishMessage = async ({ action, data }: IPubsubMessage) => {
  if (NODE_ENV === 'test') {
    return;
  }

  if (action === 'callPublish') {
    if (data.trigger === 'conversationMessageInserted') {
      const { customerId, conversationId } = data.payload;
      const conversation = await Conversations.findOne({ _id: conversationId }, { integrationId: 1 });
      const customerLastStatus = await get(`customer_last_status_${customerId}`);

      // if customer's last status is left then mark as joined when customer ask
      if (conversation && customerLastStatus === 'left') {
        set(`customer_last_status_${customerId}`, 'joined');

        // customer has joined + time
        const conversationMessages = await Conversations.changeCustomerStatus(
          'joined',
          customerId,
          conversation.integrationId,
        );

        for (const message of conversationMessages) {
          graphqlPubsub.publish('conversationMessageInserted', {
            conversationMessageInserted: message,
          });
        }

        // notify as connected
        graphqlPubsub.publish('customerConnectionChanged', {
          customerConnectionChanged: {
            _id: customerId,
            status: 'connected',
          },
        });
      }
    }

    graphqlPubsub.publish(data.trigger, { [data.trigger]: data.payload });
  }

  if (action === 'activityLog') {
    ActivityLogs.createLogFromWidget(data.type, data.payload);
  }
};

const convertPubSubBuffer = (data: Buffer) => {
  return JSON.parse(data.toString());
};

export const graphqlPubsub = createPubsubInstance();
