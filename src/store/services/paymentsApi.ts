import { baseApi } from '../api/baseApi';
import { PaymentsApiResponse } from '../../types/payments';

export interface AddPaymentPayload {
  studentId: string;
  studentName: string;
  className: string;
  name: string;
  amount: number;
  paymentType: string;
  dueDate?: string;
  status?: string;
}

export interface AddPaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: any;
  };
}

export interface GetAllPaymentsResponse {
  success: boolean;
  message: string;
  data: {
    payments: any[];
    count: number;
  };
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentsByStudentId: builder.mutation<PaymentsApiResponse, { studentId: string }>({
      query: (body) => ({
        url: '/payments/get',
        method: 'POST',
        body,
      }),
    }),
    addPayment: builder.mutation<AddPaymentResponse, AddPaymentPayload>({
      query: (body) => ({
        url: '/payments/add',
        method: 'POST',
        body,
      }),
    }),
    getAllPayments: builder.query<GetAllPaymentsResponse, void>({
      query: () => ({
        url: '/payments/all',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetPaymentsByStudentIdMutation, useAddPaymentMutation, useGetAllPaymentsQuery } = paymentsApi;


