import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { EncryptionService } from '../utils/encryption';

interface RegisterFormProps {
  onBack: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);

  const { register } = useAuth();

  const handlePasswordChange = (password: string) => {
    setMasterPassword(password);
    if (password) {
      const strength = EncryptionService.calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Digite seu e-mail');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Digite um e-mail válido');
      return false;
    }

    if (masterPassword.length < 8) {
      Alert.alert('Erro', 'A senha mestra deve ter pelo menos 8 caracteres');
      return false;
    }

    if (masterPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }

    if (passwordStrength?.score < 3) {
      Alert.alert(
        'Senha Fraca',
        'Sua senha mestra é muito fraca. Ela protegerá todos os seus dados. Deseja continuar mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => handleRegister() },
        ]
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await register(email.trim(), masterPassword, biometricEnabled);
    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message || 'Falha ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      handleRegister();
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '#666';
    if (passwordStrength.score >= 5) return '#4CAF50';
    if (passwordStrength.score >= 4) return '#8BC34A';
    if (passwordStrength.score >= 3) return '#FF9800';
    if (passwordStrength.score >= 2) return '#FF5722';
    return '#F44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#00D4FF" />
            </TouchableOpacity>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Crie sua senha mestra - ela será a única chave para seus dados
            </Text>
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
                  onChangeText={handlePasswordChange}
                  placeholder="Digite uma senha forte"
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
              
              {passwordStrength && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          backgroundColor: getPasswordStrengthColor(),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                    {passwordStrength.label}
                  </Text>
                  {passwordStrength.suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {passwordStrength.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
                        <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha Mestra</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="#666"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.biometricContainer}>
              <View style={styles.biometricInfo}>
                <Ionicons name="finger-print" size={24} color="#00D4FF" />
                <View style={styles.biometricTextContainer}>
                  <Text style={styles.biometricTitle}>Desbloqueio Biométrico</Text>
                  <Text style={styles.biometricDescription}>
                    Permitir desbloqueio com impressão digital ou Face ID
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#333', true: '#00D4FF40' }}
                thumbColor={biometricEnabled ? '#00D4FF' : '#666'}
              />
            </View>

            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                Importante: Memorize bem sua senha mestra. Ela não pode ser recuperada se for esquecida!
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Criando Conta...' : 'Criar Conta'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  strengthContainer: {
    marginTop: 12,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionsContainer: {
    marginTop: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 2,
  },
  biometricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A365D',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  biometricTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  biometricDescription: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#FF9800',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
});