export type Role = 'ADMIN' | 'ASSISTANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  canRegisterExpenses: boolean;
  canViewOtherDays: boolean;
  createdAt?: string;
}

export type ProgramType =
  | 'TRAINING_CONSTELLATIONS'
  | 'BIODECODING_CERTIFICATION'
  | 'ONE_DAY_CONSTELLATION_EVENT';
export type ProgramStatus = 'ACTIVE' | 'INACTIVE';
export type OneDayEventStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';
export type AttendanceMatrixStatus =
  | 'ASISTIO_PAGO'
  | 'ASISTIO_NO_PAGO'
  | 'NO_ASISTIO_PAGO'
  | 'NO_ASISTIO_NO_PAGO'
  | 'SIN_REGISTRO';
export type GroupStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';
export type StudentStatus = 'ACTIVE' | 'PAUSED' | 'WITHDRAWN' | 'FINISHED';
export type ModuleStatus = 'ACTIVE' | 'INACTIVE';
export type SessionStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type PaymentMethod =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'TARJETA'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'OTRO';
export type ExpenseCategory =
  | 'SALON'
  | 'ASISTENTE'
  | 'PUBLICIDAD'
  | 'MATERIALES'
  | 'TRANSPORTE'
  | 'REFRIGERIOS'
  | 'OFICINA'
  | 'OTRO';

export interface Program {
  id: string;
  name: string;
  type: ProgramType;
  description?: string | null;
  status: ProgramStatus;
  groups?: Group[];
  moduleTemplates?: ProgramModuleTemplate[];
  events?: OneDayEvent[];
  _count?: { groups: number; moduleTemplates: number; events: number };
}

export interface Group {
  id: string;
  programId: string;
  name: string;
  cohort?: string | null;
  startDate?: string | null;
  status: GroupStatus;
  notes?: string | null;
  program?: Pick<Program, 'id' | 'name' | 'type'> | null;
  _count?: { students: number; sessions: number };
}

export interface Student {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  groupId?: string | null;
  status: StudentStatus;
  enrolledAt: string;
  notes?: string | null;
  group?: Group | null;
}

export interface ProgramModuleTemplate {
  id: string;
  programId: string;
  moduleNumber: number;
  name: string;
  defaultPrice: number;
  status: ModuleStatus;
}

export interface GroupModuleCounts {
  sessions: number;
  payments: number;
  attendances: number;
}

export interface GroupModule {
  id: string;
  groupId: string;
  programId: string;
  name: string;
  moduleNumber: number;
  price: number;
  date?: string | null;
  description?: string | null;
  status: ModuleStatus;
  group?: Pick<Group, 'id' | 'name'> | null;
  program?: Pick<Program, 'id' | 'name' | 'type'> | null;
  counts?: GroupModuleCounts;
}

export interface ClassSession {
  id: string;
  groupId?: string | null;
  groupModuleId?: string | null;
  oneDayEventId?: string | null;
  title?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  place?: string | null;
  status: SessionStatus;
  notes?: string | null;
  group?: Group | null;
  groupModule?: GroupModule | null;
  oneDayEvent?: OneDayEvent | null;
}

export interface Payment {
  id: string;
  studentId?: string | null;
  groupId?: string | null;
  groupModuleId?: string | null;
  sessionId?: string | null;
  oneDayEventId?: string | null;
  concept?: string | null;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  observation?: string | null;
  student?: Student | null;
  group?: Group | null;
  groupModule?: GroupModule | null;
  oneDayEvent?: OneDayEvent | null;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  groupId?: string | null;
  group?: Group | null;
}

export interface OneDayEvent {
  id: string;
  programId: string;
  title: string;
  date: string;
  attendeesCount: number;
  constellatedCount: number;
  observations?: string | null;
  status: OneDayEventStatus;
  program?: Program | null;
}

export interface AttendanceMatrix {
  group: { id: string; name: string; programId: string };
  modules: { id: string; number: number; name: string }[];
  rows: {
    studentId: string;
    fullName: string;
    cells: { moduleId: string; status: AttendanceMatrixStatus }[];
  }[];
}
