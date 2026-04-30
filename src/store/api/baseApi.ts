import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://padmaibackend.vercel.app/api',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    prepareHeaders: (headers, { getState }) => {
      const state: any = getState();
      const token: string | null = state?.auth?.token ?? null;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Progress'],
  endpoints: () => ({}),
});


