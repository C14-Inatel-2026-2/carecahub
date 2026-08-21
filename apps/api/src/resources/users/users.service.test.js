import { describe, expect, it, vi } from 'vitest';
import { getUsers } from './users.service.js';
import { findManyUsers } from './users.repository.js';

vi.mock(import('./users.repository.js'), () => ({
  findManyUsers: vi.fn(),
}));

describe('getUsers', () => {
  it('returns users from repository', async () => {
    const expectedUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'ana@email.com',
        name: 'Ana',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'bia@email.com',
        name: 'Bia',
      },
    ];

    vi.mocked(findManyUsers).mockResolvedValue(expectedUsers);

    const result = await getUsers();

    expect(findManyUsers).toHaveBeenCalledOnce();
    expect(result).toEqual(expectedUsers);
  });
});
