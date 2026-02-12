import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import enums from "../utils/enums.js";

export const userRolesEnums = pgEnum("user_roles", Object.values(enums.USER_ROLES));
export const projectStatusEnums = pgEnum("project_status", Object.values(enums.PROJECT_STATUS));
export const commentStatusEnums = pgEnum("comment_status", Object.values(enums.COMMENT_STATUS));

export const usersTable = pgTable("users", {
  id: serial().primaryKey(),
  name: varchar('name',{ length: 255 }).notNull(),
  email: varchar('email',{ length: 255 }).notNull().unique(),
  password: varchar('password',{ length: 255 }).notNull(),
  role: userRolesEnums('role').notNull().default(enums.USER_ROLES.STUDENT),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(()=>sql`CURRENT_TIMESTAMP`)
});

export const projects = pgTable("projects", {
  id: serial().primaryKey(),
  title: varchar('title',{ length: 255 }).notNull(),
  description: varchar('description',{ length: 1000 }).notNull(),
  status: projectStatusEnums('status').notNull().default(enums.PROJECT_STATUS.PENDING),
  mentorId: integer('mentor_id').references(() => usersTable.id),
  techStack: varchar('tech_stack',{ length: 1000 }).notNull(),
  course: varchar('course',{ length: 255 }).notNull(),
  semester: varchar('semester',{ length: 255 }).notNull(),
  section: varchar('section',{ length: 255 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  submissionDate: timestamp('submission_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(()=>sql`CURRENT_TIMESTAMP`)
});

export const projectStudents = pgTable("project_students", {
  id: serial().primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  studentId: integer('student_id').references(() => usersTable.id),
  isLeader: boolean('is_leader').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(()=>sql`CURRENT_TIMESTAMP`)
});

export const comments = pgTable("comments", {
  id: serial().primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  userId: integer('user_id').references(() => usersTable.id),
  content: varchar('content',{ length: 1000 }).notNull(),
  status: commentStatusEnums('status').notNull().default(enums.COMMENT_STATUS.ACTIVE),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(()=>sql`CURRENT_TIMESTAMP`)
});