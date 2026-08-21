import { describe, expect, it, vi } from 'vitest';
import { buildUsersRepository } from './users.repository.js';

describe('buildUsersRepository', () => {
  it('selects public user fields from users table', async () => {
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

    const fromUsersTableMock = vi.fn().mockResolvedValue(expectedUsers);
    const selectUsersFieldsMock = vi.fn().mockReturnValue({
      from: fromUsersTableMock,
    });
    const usersTable = {
      id: Symbol('users.id'),
      email: Symbol('users.email'),
      name: Symbol('users.name'),
    };

    const usersRepository = buildUsersRepository({
      db: { select: selectUsersFieldsMock },
      schema: { users: usersTable },
    });

    const result = await usersRepository.findManyUsers();

    expect(selectUsersFieldsMock).toHaveBeenCalledOnce();
    expect(selectUsersFieldsMock).toHaveBeenCalledWith({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
    });
    expect(fromUsersTableMock).toHaveBeenCalledOnce();
    expect(fromUsersTableMock).toHaveBeenCalledWith(usersTable);
    expect(result).toEqual(expectedUsers);
  });
});
