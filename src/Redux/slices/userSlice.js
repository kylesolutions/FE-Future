import { createSlice, createAction } from '@reduxjs/toolkit';

export const logoutUser = createAction('user/logout');

const userSlice = createSlice({
  name: 'user',
  initialState: {
    id: '',
    username: '',
    name: '',
    email: '',
    phone: '',
    type: '',
    is_blocked: false,
    is_staff: false,
  },
  reducers: {
    updateUser: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser, (state) => {
      return {
        id: '',
        username: '',
        name: '',
        email: '',
        phone: '',
        type: '',
        is_blocked: false,
        is_staff: false,
      };
    });
  },
});

export const { updateUser } = userSlice.actions;
export default userSlice.reducer;