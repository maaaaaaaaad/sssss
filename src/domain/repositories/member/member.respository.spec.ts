import { PrismaClient } from '@prisma/client';
import { MemberRepository } from './member.repository';
import { Member } from '../../entities/member';
import { CREATION_FAILED } from '../../../common/contants/failed';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EMAIL_ALREADY_EXIST } from '../../../common/contants/already_exist';

jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');

  return {
    __esModule: true,
    ...originalModule,
    PrismaClient: jest.fn().mockImplementation(() => ({
      members: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    })),
  };
});

describe('MemberRepository', () => {
  let repository: MemberRepository;
  let prismaClientMock: PrismaClient;

  beforeEach(() => {
    prismaClientMock = new PrismaClient();
    repository = new MemberRepository(prismaClientMock);
  });

  const memberData = {
    email: 'test@example.com',
    password: 'password123',
    isAdmin: false,
  };

  it('should create a new member and return it', async () => {
    const createdPrismaMember = {
      id: '1',
      ...memberData,
    };

    jest
      .mocked(prismaClientMock.members.create)
      .mockResolvedValue(createdPrismaMember);
    jest
      .mocked(prismaClientMock.$transaction)
      .mockImplementation(async (transactionCallback) => {
        return transactionCallback(prismaClientMock);
      });

    const result = await repository.createUser(
      memberData.email,
      memberData.password,
      memberData.isAdmin,
    );

    expect(result).toEqual(
      new Member(
        createdPrismaMember.id,
        createdPrismaMember.email,
        createdPrismaMember.password,
        createdPrismaMember.isAdmin,
      ),
    );
    expect(prismaClientMock.$transaction).toHaveBeenCalled();
    expect(prismaClientMock.members.create).toHaveBeenCalledWith({
      data: memberData,
    });
  });

  it('should fail to create a new member due to duplicate email', async () => {
    const duplicateEmailError = new PrismaClientKnownRequestError(
      EMAIL_ALREADY_EXIST,
      { code: 'P2002', clientVersion: '0.01' },
    );

    jest
      .mocked(prismaClientMock.members.create)
      .mockRejectedValue(duplicateEmailError);

    await expect(
      repository.createUser(
        memberData.email,
        memberData.password,
        memberData.isAdmin,
      ),
    ).rejects.toThrow(CREATION_FAILED);
  });
});