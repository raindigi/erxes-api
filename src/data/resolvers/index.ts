import * as permissionActions from '../permissions/actions';
import ActivityLog from './activityLog';
import Board from './boards';
import Brand from './brand';
import Channel from './channel';
import Company from './company';
import Conversation from './conversation';
import ConversationMessage from './conversationMessage';
import Customer from './customer';
import customScalars from './customScalars';
import Deal from './deals';
import EngageMessage from './engage';
import { field, fieldsGroup } from './field';
import Form from './forms';
import ImportHistory from './importHistory';
import Integration from './integration';
import InternalNote from './internalNote';
import KnowledgeBaseArticle from './knowledgeBaseArticle';
import KnowledgeBaseCategory from './knowledgeBaseCategory';
import KnowledgeBaseTopic from './knowledgeBaseTopic';
import Mutation from './mutations';
import Notification from './notification';
import Permission from './permission';
import Pipeline from './pipeline';
import Query from './queries';
import ResponseTemplate from './responseTemplate';
import Script from './script';
import Segment from './segment';
import Stage from './stages';
import Subscription from './subscriptions';
import Task from './tasks';
import Ticket from './tickets';
import User from './user';
import UsersGroup from './usersGroup';

const resolvers: any = {
  ...customScalars,
  ...permissionActions,

  ResponseTemplate,
  Script,
  Integration,
  Channel,
  Brand,
  InternalNote,
  Customer,
  Company,
  Segment,
  EngageMessage,
  Conversation,
  ConversationMessage,
  Deal,
  Stage,
  Board,

  Mutation,
  Query,
  Subscription,

  KnowledgeBaseArticle,
  KnowledgeBaseCategory,
  KnowledgeBaseTopic,

  Notification,

  ActivityLog,
  Form,
  FieldsGroup: fieldsGroup,
  Field: field,
  User,
  ImportHistory,
  Permission,
  Ticket,
  Task,
  UsersGroup,
  Pipeline,
};

export default resolvers;
