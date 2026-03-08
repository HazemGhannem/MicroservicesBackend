import { producer } from "./config";

export const sendUserCreated = async (data: {
  email: string;
  name: string;
 }) => {
  await producer.send({
      topic: 'user-created',
      messages: [
        {
          value: JSON.stringify({
            to: data.email,
            subject: 'Welcome!',
            body: `Hi ${data.name}, welcome to our platform!`,
          }),
        },
      ],
    });
};
 