import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { LoginRegisterFlow } from '../components/LoginRegisterFlow';
import { VaultScreen } from '../components/VaultScreen';
import { LoadingScreen } from '../components/LoadingScreen';

const AppContent = () => {
  const { user, isLoading, isFirstTime } = useAuth();

  console.log('🏠 App state:', { 
    isLoading, 
    isFirstTime, 
    hasUser: !!user,
    userEmail: user?.email 
  });

  if (isLoading) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen />;
  }

  // First time users see onboarding
  if (isFirstTime) {
    console.log('👋 Showing onboarding for first time user');
    return <OnboardingScreen />;
  }

  // If user is logged in, show vault
  if (user) {
    console.log('✅ User logged in, showing vault');
    return <VaultScreen />;
  }

  // Otherwise show login/register flow
  console.log('🔑 Showing login/register flow');
  return <LoginRegisterFlow />;
};

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A2540" />
      <AuthProvider>
        <View style={styles.container}>
          <AppContent />
        </View>
      </AuthProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
});