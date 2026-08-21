export const getUsersResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'email', 'name'],
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
    },
  },
};
