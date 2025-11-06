import { baseApi } from '../api/baseApi';

export interface AttendanceStudent {
  id: string;
  firstName: string;
  lastName: string;
  classRollNo: string;
  registrationNo: string;
  attendanceStatus: 'present' | 'absent' | 'late' | null;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  notMarked: number;
}

export interface GetClassAttendancePayload {
  teacherId: string;
  date: string; // Format: "YYYY-MM-DD"
}

export interface GetClassAttendanceResponse {
  success: boolean;
  message: string;
  data: {
    class: string;
    section: string;
    summary: AttendanceSummary;
    students: AttendanceStudent[];
    count: number;
  };
}

export interface SetAttendancePayload {
  teacherId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  date: string; // Format: "YYYY-MM-DD"
}

export interface SetAttendanceStudent {
  id: string;
  firstName: string;
  lastName: string;
  attendanceStatus: 'present' | 'absent' | 'late';
}

export interface SetAttendanceResponse {
  success: boolean;
  message: string;
  data?: {
    student: SetAttendanceStudent;
  };
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassAttendance: builder.mutation<GetClassAttendanceResponse, GetClassAttendancePayload>({
      query: (body) => ({
        url: '/getClassAttendance',
        method: 'POST',
        body: {
          teacherId: body.teacherId,
          date: body.date,
        },
      }),
    }),
    setAttendance: builder.mutation<SetAttendanceResponse, SetAttendancePayload>({
      query: (body) => ({
        url: '/setAttendance',
        method: 'POST',
        body: {
          teacherId: body.teacherId,
          studentId: body.studentId,
          status: body.status,
          date: body.date,
        },
      }),
    }),
  }),
});

export const {
  useGetClassAttendanceMutation,
  useSetAttendanceMutation,
} = attendanceApi;

