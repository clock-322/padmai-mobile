import { baseApi } from '../api/baseApi';

export interface SubjectProgress {
  subject: string;
  marksObtained: number | null;
  totalMarks: number;
  grade: string;
  remarks: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  month: number;
  year: number;
  subjects: SubjectProgress[];
  updatedAt?: string;
}

export interface GetProgressPayload {
  teacherId: string;
  month: number;
  year: number;
}

export interface GetProgressResponse {
  success: boolean;
  message: string;
  data: {
    progress: StudentProgress[];
  };
}

export interface SaveProgressPayload {
  teacherId: string;
  studentId: string;
  month: number;
  year: number;
  subjects: SubjectProgress[];
}

export interface SaveProgressResponse {
  success: boolean;
  message: string;
  data: {
    progress: StudentProgress;
  };
}

export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProgress: builder.query<GetProgressResponse, GetProgressPayload>({
      query: ({ teacherId, month, year }) => ({
        url: `/progress?teacherId=${teacherId}&month=${month}&year=${year}`,
        method: 'GET',
      }),
      providesTags: ['Progress'],
    }),
    saveProgress: builder.mutation<SaveProgressResponse, SaveProgressPayload>({
      query: (body) => ({
        url: '/progress',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Progress'],
    }),
  }),
});

export const { useGetProgressQuery, useSaveProgressMutation } = progressApi;
