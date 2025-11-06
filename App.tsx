import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from './src/providers/DataProvider';
import { ToastProvider } from './src/contexts/ToastContext';
import { ModalProvider } from './src/contexts/ModalContext';
import Toast from './src/components/Toast';
import RootNavigation from './src/navigation/RootNavigation';
import { AuthProvider } from './src/contexts/AuthContext';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/store';
import { hydrated, loadCredentials, setCredentials } from './src/store/slices/authSlice';

const AuthHydrator: React.FC = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    (async () => {
      try {
        const { token, user } = await loadCredentials();
        if (token && user) {
          dispatch(setCredentials({ token, user }));
        }
      } finally {
        dispatch(hydrated());
      }
    })();
  }, [dispatch]);
  return null;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <DataProvider>
          <AuthProvider>
            <ToastProvider>
              <ModalProvider>
                <StatusBar barStyle="light-content" backgroundColor="#2F6FED" />
                <AuthHydrator />
                <RootNavigation />
                <Toast />
              </ModalProvider>
            </ToastProvider>
          </AuthProvider>
        </DataProvider>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
