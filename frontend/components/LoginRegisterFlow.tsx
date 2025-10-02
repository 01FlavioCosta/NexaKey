import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterForm } from './RegisterForm';

export const LoginRegisterFlow = () => {
  const [showLogin, setShowLogin] = useState(true);

  console.log('🔄 LoginRegisterFlow state:', { showLogin });

  if (showLogin) {
    return (
      <LoginScreen 
        onShowRegister={() => {
          console.log('🔄 Switching to register');
          setShowLogin(false);
        }} 
      />
    );
  }

  return (
    <RegisterForm 
      onBack={() => {
        console.log('🔄 Switching to login');
        setShowLogin(true);
      }}
      onShowLogin={() => {
        console.log('🔄 Switching to login');
        setShowLogin(true);
      }}
    />
  );
};