import { baseApi } from '../api/baseApi';
import {
  AddStudentPayload,
  AddStudentResponse,
  GetStudentsResponse,
  UpdateStudentPayload,
  UpdateStudentResponse,
  DeleteStudentResponse,
  GetClassStudentsPayload,
  GetClassStudentsResponse,
} from '../../types/students';

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addStudent: builder.mutation<AddStudentResponse, AddStudentPayload>({
      query: (body) => ({
        url: '/addStudent',
        method: 'POST',
        body,
      }),
    }),
    getStudentsByParentId: builder.mutation<GetStudentsResponse, { parentId: string }>({
      query: (body) => ({
        url: '/getParentStudent',
        method: 'POST',
        body,
      }),
    }),
    updateStudent: builder.mutation<UpdateStudentResponse, UpdateStudentPayload>({
      query: (body) => {
        const { studentId, ...payload } = body;
        return {
          url: `/updateStudent/${studentId}`,
          method: 'PUT',
          body: payload,
        };
      },
    }),
    deleteStudent: builder.mutation<DeleteStudentResponse, { studentId: string }>({
      query: (body) => ({
        url: `/deleteStudent/${body.studentId}`,
        method: 'DELETE',
      }),
    }),
    getClassStudents: builder.mutation<GetClassStudentsResponse, GetClassStudentsPayload>({
      query: (body) => ({
        url: '/getClassStudents',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useAddStudentMutation,
  useGetStudentsByParentIdMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useGetClassStudentsMutation,
} = studentsApi;

