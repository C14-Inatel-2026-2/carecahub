// @ts-nocheck

import { describe, expect, it, vi } from 'vitest';
import { buildUsersRepository } from './users.repository.js';

describe('usersRepository', () => {
  it('listUsers - selects public user fields from users table', async () => {
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

    const result = await usersRepository.listUsers();

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

  it('findUserById - selects public user fields from users table where id matches', async () => {
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

    const whereUserByIdMock = vi.fn().mockResolvedValue([expectedUsers[0]]);
    const fromUsersTableMock = vi.fn().mockReturnValue({
      where: whereUserByIdMock,
    });
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

    const result = await usersRepository.findUserById('550e8400-e29b-41d4-a716-446655440000');

    expect(whereUserByIdMock).toHaveBeenCalledOnce();
    expect(whereUserByIdMock).toHaveBeenCalledWith(expect.anything());
    expect(selectUsersFieldsMock).toHaveBeenCalledOnce();
    expect(selectUsersFieldsMock).toHaveBeenCalledWith({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
    });
    expect(fromUsersTableMock).toHaveBeenCalledOnce();
    expect(fromUsersTableMock).toHaveBeenCalledWith(usersTable);
    expect(result).toEqual(expectedUsers[0]);
  });
});
