import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { LoginScreen } from '../components/LoginScreen';
import { VaultScreen } from '../components/VaultScreen';
import { LoadingScreen } from '../components/LoadingScreen';

const AppContent = () => {
  const { user, isLoading, isFirstTime } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isFirstTime) {
    return <OnboardingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <VaultScreen />;
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