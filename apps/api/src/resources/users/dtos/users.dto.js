/**
 * @typedef {object} UserResponseDto
 * @property {string} id
 * @property {string} email
 * @property {string} name
 */

export const userResponseSchema = {
  type: 'object',
  required: ['id', 'email', 'name'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string' },
    name: { type: 'string' },
  },
};

export const getUsersResponseSchema = {
  type: 'array',
  items: userResponseSchema,
};
