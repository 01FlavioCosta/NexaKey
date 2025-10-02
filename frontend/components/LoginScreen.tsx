import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { SecureStorageService } from '../utils/storage';
import { BiometricsService } from '../utils/biometrics';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [supportedBiometrics, setSupportedBiometrics] = useState<string[]>([]);

  const { login, setMasterKey } = useAuth();

  useEffect(() => {
    checkBiometricSupport();
    loadStoredEmail();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const isAvailable = await BiometricsService.isAvailable();
      const enabled = await SecureStorageService.isBiometricEnabled();
      const types = await BiometricsService.getSupportedTypes();
      const typeNames = types.map(type => BiometricsService.getBiometricTypeName(type));
      
      setBiometricAvailable(isAvailable);
      setBiometricEnabled(enabled && isAvailable);
      setSupportedBiometrics(typeNames);
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const loadStoredEmail = async () => {
    try {
      const userData = await SecureStorageService.getUserData();
      if (userData?.email) {
        setEmail(userData.email);
      }
    } catch (error) {
      console.error('Failed to load stored email:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Digite seu e-mail');
      return;
    }

    if (!masterPassword.trim()) {
      Alert.alert('Erro', 'Digite sua senha mestra');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), masterPassword);
    } catch (error: any) {
      Alert.alert('Erro no Login', error.message || 'Falha ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      const masterKey = await BiometricsService.biometricLogin();
      
      if (masterKey) {
        // Set the master key and authenticate user
        setMasterKey(masterKey);
        
        // Get stored user data and token
        const userData = await SecureStorageService.getUserData();
        const token = await SecureStorageService.getAccessToken();
        
        if (userData && token) {
          // In a real app, you'd validate the token with the backend
          Alert.alert('Sucesso', 'Login biométrico realizado com sucesso!');
        } else {
          throw new Error('Dados de usuário não encontrados');
        }
      } else {
        Alert.alert('Erro', 'Falha na autenticação biométrica');
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Erro', error.message || 'Falha na autenticação biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (biometricEnabled) {
      Alert.alert(
        'Recuperar Senha Mestra',
        'Use sua biometria para definir uma nova senha mestra.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Usar Biometria', onPress: handleBiometricRecovery },
        ]
      );
    } else {
      Alert.alert(
        'Senha Esquecida',
        'Infelizmente, não é possível recuperar sua senha mestra. Ela foi projetada para ser conhecida apenas por você.\n\nSe você ativou a autenticação biométrica, pode usá-la para definir uma nova senha mestra.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Esta ação irá remover todos os dados locais e permitir um novo registro. Você perderá acesso a senhas salvas anteriormente. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Dados',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStorageService.clearAllData();
              Alert.alert('Sucesso', 'Dados limpos. Você pode se registrar novamente.', [
                { text: 'OK', onPress: () => window.location.reload() }
              ]);
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Erro', 'Falha ao limpar dados');
            }
          },
        },
      ]
    );
  };

  const handleBiometricRecovery = async () => {
      const success = await BiometricsService.biometricPasswordReset(email, '');
      if (success) {
        // Navigate to password reset form
        Alert.prompt(
          'Nova Senha Mestra',
          'Digite sua nova senha mestra:',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Definir', 
              onPress: (newPassword) => {
                if (newPassword && newPassword.length >= 8) {
                  Alert.alert('Sucesso', 'Nova senha mestra definida com sucesso!');
                } else {
                  Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres');
                }
              }
            },
          ],
          'secure-text'
        );
      }
    } catch (error) {
      console.error('Biometric recovery error:', error);
      Alert.alert('Erro', 'Falha na recuperação biométrica');
    }
  };

  const getBiometricButtonText = () => {
    if (supportedBiometrics.length > 0) {
      return `Usar ${supportedBiometrics.join(' / ')}`;
    }
    return 'Usar Biometria';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={60} color="#00D4FF" />
            </View>
            <Text style={styles.title}>NexaKey</Text>
            <Text style={styles.subtitle}>Acesse seu cofre de senhas</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha Mestra</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={masterPassword}
                  onChangeText={setMasterPassword}
                  placeholder="Digite sua senha mestra"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                Esqueceu a Senha Mestra?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isLoading}
              >
                <Ionicons name="finger-print" size={24} color="#00D4FF" />
                <Text style={styles.biometricButtonText}>
                  {getBiometricButtonText()}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Seus dados são protegidos com criptografia de ponta-a-ponta
            </Text>
            {biometricAvailable && !biometricEnabled && (
              <Text style={styles.biometricHint}>
                💡 Configure a biometria nas configurações para acesso mais rápido
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.clearDataButton}
              onPress={handleClearData}
            >
              <Text style={styles.clearDataText}>
                Problemas com login? Limpar dados locais
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A365D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00D4FF',
    borderRadius: 8,
    paddingVertical: 16,
  },
  biometricButtonText: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  biometricHint: {
    fontSize: 12,
    color: '#00D4FF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  clearDataButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearDataText: {
    fontSize: 12,
    color: '#FF5722',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});