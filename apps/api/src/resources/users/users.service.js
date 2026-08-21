import { findManyUsers } from './users.repository.js';

export async function getUsers() {
  return findManyUsers();
}
