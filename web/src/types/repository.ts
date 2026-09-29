export type Repository = {
  id: string;
  url: string;
  commitCount: number;
  branchCount: number;
  ownerId?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type GetRepositoryResponse = Repository;
