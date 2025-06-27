import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userSlice from './slices/userSlice';
import { configureStore } from '@reduxjs/toolkit';

const persistConfig = {
  key: 'root',
  storage,
};

const persistedUserReducer = persistReducer(persistConfig, userSlice);

export const Store = configureStore({
  reducer: {
    user: persistedUserReducer,
  },
});

export const persistor = persistStore(Store);
