import { baseApi } from '../api/baseApi';

type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  role: 'parent' | 'teacher' | 'admin';
};

type RegisterResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'parent' | 'teacher' | 'admin';
      childId?: string;
      subject?: string;
      class?: string;
      section?: string;
    };
    token: string;
  };
};

type EditProfileRequest = {
  name: string;
  email: string;
};

type EditProfileResponse = {
  success: boolean;
  message: string;
  data: {
    user: { id: string; name: string; email: string; role: 'parent' | 'teacher' | 'admin' };
  };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: build.mutation<RegisterResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    editProfile: build.mutation<EditProfileResponse, EditProfileRequest>({
      query: (body) => ({ url: '/auth/edit-profile', method: 'PUT', body }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useEditProfileMutation } = authApi;


