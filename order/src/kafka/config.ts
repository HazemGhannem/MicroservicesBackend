import { Kafka, Partitioners } from 'kafkajs';
import { KAFKA_BROKER } from '../db/env';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [KAFKA_BROKER],
});

export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export const consumer = kafka.consumer({
  groupId: 'order-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  rebalanceTimeout: 60000,
  maxWaitTimeInMs: 5000,
});

 
