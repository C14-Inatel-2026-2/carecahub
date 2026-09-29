import type { Project } from "./project";
import type { User } from "./user";

export const GROUP_TAGS = ["no_project", "full", "space_available"] as const;
export type GroupTag = (typeof GROUP_TAGS)[number];

export const groupTagLabels: Record<GroupTag, string> = {
  no_project: "SEM PROJETO",
  full: "CHEIO",
  space_available: "ESPAÇO DISPONÍVEL",
};

export type Group = {
  id: string;
  friendlyId: string;
  leaderId: string;
  tags?: GroupTag[];
  project?: Project;
  members: User[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type GetGroupResponse = Group;
