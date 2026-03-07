import { Kafka, Partitioners } from 'kafkajs';
import { KAFKA_BROKER } from '../utils/env';

const kafka = new Kafka({
  clientId: 'email-service',
  brokers: [KAFKA_BROKER],
});
export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});
export const consumer = kafka.consumer({
  groupId: 'email-group',
  sessionTimeout: 30000, // ✅ explicit session timeout
  heartbeatInterval: 3000, // ✅ must be < sessionTimeout / 3
  rebalanceTimeout: 60000, // ✅ give enough time to rejoin
  maxWaitTimeInMs: 5000,
});