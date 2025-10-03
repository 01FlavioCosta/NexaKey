import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistência
import { RegisterForm } from './RegisterForm'; // Import para tela de registro

export const OnboardingScreen = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // Carrega se é first time
  React.useEffect(() => {
    const loadFirstTime = async () => {
      const saved = await AsyncStorage.getItem('isFirstTime');
      setIsFirstTime(saved === 'false' ? false : true);
    };
    loadFirstTime();
  }, []);

  const goToRegister = async () => {
    await AsyncStorage.setItem('isFirstTime', 'false');
    setShowRegister(true);
  };

  const goToLogin = async () => {
    await AsyncStorage.setItem('isFirstTime', 'false');
    Alert.alert('Login', 'Tela de login em desenvolvimento. Use "Criar Conta" para testar.');
  };

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#00D4FF" />
        </View>
        
        <Text style={styles.title}>Bem-vindo ao NexaKey</Text>
        <Text style={styles.subtitle}>Seu gerenciador de senhas seguro</Text>
        <Text style={styles.description}>
          Mantenha todas as suas senhas protegidas com criptografia militar. Uma senha mestra para acessar tudo.
        </Text>
      </View>

      <View style={styles.indicatorContainer}>
        <View style={styles.indicator} />
        <View style={[styles.indicator, styles.activeIndicator]} />
        <View style={styles.indicator} />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={goToRegister}>
        <Text style={styles.nextButtonText}>Próximo</Text>
      </TouchableOpacity>

      <View style={styles.loginLinkContainer}>
        <TouchableOpacity onPress={goToLogin}>
          <Text style={styles.loginLinkText}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#00D4FF',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#00D4FF',
    width: 24,
  },
  nextButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginBottom: 32,
  },
  nextButtonText: {
    color: '#0A2540',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});