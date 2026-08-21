import { listUsers, findUserById } from './users.repository.js';

/**
 * @returns {Promise<import('./dtos/users.dto.js').UserResponseDto[]>}
 */
export async function getUsers() {
  return listUsers();
}

/**
 * @param {string} id
 * @returns {Promise<import('./dtos/users.dto.js').UserResponseDto | undefined>}
 */
export async function getUserById(id) {
  return findUserById(id);
}
