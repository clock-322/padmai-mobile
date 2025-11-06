import { baseApi } from '../api/baseApi';
import { PaymentsApiResponse } from '../../types/payments';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentsByStudentId: builder.mutation<PaymentsApiResponse, { studentId: string }>({
      query: (body) => ({
        url: '/payments/get',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGetPaymentsByStudentIdMutation } = paymentsApi;


