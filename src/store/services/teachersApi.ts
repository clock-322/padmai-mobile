import { baseApi } from '../api/baseApi';

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  class: string | null;
  section: string | null;
  subject: string | null;
}

export interface GetTeachersResponse {
  success: boolean;
  message: string;
  data: {
    teachers: Teacher[];
    count: number;
  };
}

export interface Student {
  _id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  registrationNo: string;
  classRollNo: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllStudentsResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    count: number;
  };
}

export interface AssignTeacherClassPayload {
  teacherId: string;
  class: string;
  section: string;
  subject: string;
}

export interface AssignTeacherClassResponse {
  success: boolean;
  message: string;
  data: {
    teacher: Teacher;
  };
}

export interface GetTeacherByIdResponse {
  success: boolean;
  message: string;
  data: {
    teacher: Teacher;
  };
}

export const teachersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeachers: builder.query<GetTeachersResponse, void>({
      query: () => ({
        url: '/getTeachers',
        method: 'GET',
      }),
    }),
    getTeacherById: builder.query<GetTeacherByIdResponse, string>({
      query: (teacherId) => ({
        url: `/getTeacher/${teacherId}`,
        method: 'GET',
      }),
    }),
    getAllStudents: builder.query<GetAllStudentsResponse, void>({
      query: () => ({
        url: '/getAllStudents',
        method: 'GET',
      }),
    }),
    assignTeacherClass: builder.mutation<AssignTeacherClassResponse, AssignTeacherClassPayload>({
      query: (body) => ({
        url: '/assignTeacher',
        method: 'POST',
        body: {
          teacherId: body.teacherId,
          class: body.class,
          section: body.section,
          subject: body.subject,
        },
      }),
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useGetAllStudentsQuery,
  useAssignTeacherClassMutation,
} = teachersApi;

