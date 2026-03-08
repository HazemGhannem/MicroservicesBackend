// src/kafka/product.producer.ts
import { producer } from './config';

export const sendProductCreated = async (data: {
  productId: string;
  name: string;
  createdBy: string;
}) => {
  await producer.send({
    topic: 'product-created',
    messages: [{ value: JSON.stringify(data) }],
  });
};

export const sendProductOutOfStock = async (data: {
  productId: string;
  name: string;
  ownerEmail: string;
}) => {
  await producer.send({
    topic: 'email-topic',
    messages: [
      {
        value: JSON.stringify({
          to: data.ownerEmail,
          subject: '⚠️ Product Out of Stock',
          body: `Your product "${data.name}" is out of stock! Please restock it.`,
        }),
      },
    ],
  });
};

export const sendProductDeleted = async (data: {
  productId: string;
  name: string;
  createdBy: string;
}) => {
  await producer.send({
    topic: 'product-deleted',
    messages: [{ value: JSON.stringify(data) }],
  });
};
