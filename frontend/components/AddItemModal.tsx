import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { VaultService } from '../services/VaultService';
import { PasswordSecurityService } from '../utils/passwordSecurity';

interface VaultItem {
  id: string;
  item_type: 'password' | 'credit_card' | 'secure_note';
  decrypted_data: any;
  created_at: string;
  updated_at: string;
}

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingItem?: VaultItem | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onSave,
  editingItem,
}) => {
  const [selectedType, setSelectedType] = useState<'password' | 'credit_card' | 'secure_note'>('password');
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);

  const { masterKey } = useAuth();
  const vaultService = new VaultService();

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setSelectedType(editingItem.item_type);
        setFormData(editingItem.decrypted_data);
      } else {
        resetForm();
      }
    }
  }, [visible, editingItem]);

  const resetForm = () => {
    switch (selectedType) {
      case 'password':
        setFormData(vaultService.createPasswordTemplate());
        break;
      case 'credit_card':
        setFormData(vaultService.createCreditCardTemplate());
        break;
      case 'secure_note':
        setFormData(vaultService.createSecureNoteTemplate());
        break;
    }
  };

  const handleTypeChange = (type: 'password' | 'credit_card' | 'secure_note') => {
    if (editingItem) return; // Don't allow type change when editing
    
    setSelectedType(type);
    switch (type) {
      case 'password':
        setFormData(vaultService.createPasswordTemplate());
        break;
      case 'credit_card':
        setFormData(vaultService.createCreditCardTemplate());
        break;
      case 'secure_note':
        setFormData(vaultService.createSecureNoteTemplate());
        break;
    }
  };

  const generatePassword = () => {
    const newPassword = PasswordSecurityService.generateSecurePassword(16, true, true);
    setFormData({ ...formData, password: newPassword });
    
    // Analisar a força da nova senha
    const analysis = PasswordSecurityService.analyzePassword(newPassword);
    setPasswordStrength(analysis);
    
    // Mostrar informações sobre a senha gerada
    const crackTime = PasswordSecurityService.estimateCrackTime(newPassword);
    Alert.alert(
      'Senha Forte Gerada!',
      `Força: ${analysis.strength}\nTempo estimado para quebrar: ${crackTime}`,
      [{ text: 'OK' }]
    );
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password && selectedType === 'password') {
      const analysis = PasswordSecurityService.analyzePassword(password, formData.name);
      setPasswordStrength(analysis);
    } else {
      setPasswordStrength(null);
    }
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Muito Forte': return '#4CAF50';
      case 'Forte': return '#8BC34A';
      case 'Moderada': return '#FF9800';
      case 'Fraca': return '#FF5722';
      case 'Muito Fraca': return '#F44336';
      default: return '#666';
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return false;
    }

    if (selectedType === 'password') {
      if (!formData.password?.trim()) {
        Alert.alert('Erro', 'Senha é obrigatória');
        return false;
      }
    }

    if (selectedType === 'credit_card') {
      if (!formData.cardNumber?.trim()) {
        Alert.alert('Erro', 'Número do cartão é obrigatório');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      if (editingItem) {
        await vaultService.updateVaultItem(editingItem.id, formData, masterKey!);
      } else {
        await vaultService.createVaultItem(selectedType, formData, masterKey!);
      }

      onSave();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao salvar item');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordForm = () => (
    <ScrollView style={styles.form}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={formData.name || ''}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex: Gmail, Facebook..."
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Usuário/E-mail</Text>
        <TextInput
          style={styles.input}
          value={formData.username || ''}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
          placeholder="usuario@exemplo.com"
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Senha *</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={formData.password || ''}
            onChangeText={handlePasswordChange}
            placeholder="Digite a senha"
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
        
        <TouchableOpacity style={styles.generateButton} onPress={generatePassword}>
          <Ionicons name="refresh" size={16} color="#00D4FF" />
          <Text style={styles.generateButtonText}>Gerar Senha Forte</Text>
        </TouchableOpacity>

        {/* Password strength indicator */}
        {passwordStrength && formData.password && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthLabel}>Força da Senha:</Text>
              <Text style={[
                styles.strengthValue,
                { color: getPasswordStrengthColor(passwordStrength.strength) }
              ]}>
                {passwordStrength.strength}
              </Text>
            </View>
            
            <View style={styles.strengthBar}>
              <View style={[
                styles.strengthFill,
                {
                  width: `${(passwordStrength.score / 6) * 100}%`,
                  backgroundColor: getPasswordStrengthColor(passwordStrength.strength),
                }
              ]} />
            </View>

            {passwordStrength.isCompromised && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={16} color="#FF5722" />
                <Text style={styles.warningText}>
                  ⚠️ Esta senha foi comprometida em vazamentos de dados
                </Text>
              </View>
            )}

            {passwordStrength.issues.length > 0 && (
              <View style={styles.issuesContainer}>
                <Text style={styles.issuesTitle}>Sugestões:</Text>
                {passwordStrength.recommendations.slice(0, 2).map((rec: string, index: number) => (
                  <Text key={index} style={styles.issueText}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Website/URL</Text>
        <TextInput
          style={styles.input}
          value={formData.website || ''}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          placeholder="https://exemplo.com"
          placeholderTextColor="#666"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes || ''}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Informações adicionais..."
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );

  const renderCreditCardForm = () => (
    <ScrollView style={styles.form}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nome do Cartão *</Text>
        <TextInput
          style={styles.input}
          value={formData.name || ''}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex: Cartão Principal, Cartão Empresarial"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nome do Portador</Text>
        <TextInput
          style={styles.input}
          value={formData.cardholderName || ''}
          onChangeText={(text) => setFormData({ ...formData, cardholderName: text })}
          placeholder="Nome como está no cartão"
          placeholderTextColor="#666"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Número do Cartão *</Text>
        <TextInput
          style={styles.input}
          value={formData.cardNumber || ''}
          onChangeText={(text) => setFormData({ ...formData, cardNumber: text })}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Validade</Text>
          <TextInput
            style={styles.input}
            value={formData.expiryDate || ''}
            onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
            placeholder="MM/AA"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>CVV</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={formData.cvv || ''}
              onChangeText={(text) => setFormData({ ...formData, cvv: text })}
              placeholder="123"
              placeholderTextColor="#666"
              keyboardType="numeric"
              secureTextEntry={!showCvv}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCvv(!showCvv)}
            >
              <Ionicons
                name={showCvv ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes || ''}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Informações adicionais..."
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );

  const renderSecureNoteForm = () => (
    <ScrollView style={styles.form}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={formData.name || ''}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex: Códigos de Acesso, Informações Importantes"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Conteúdo</Text>
        <TextInput
          style={[styles.input, styles.largeTextArea]}
          value={formData.notes || ''}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Digite suas anotações seguras aqui..."
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={10}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );

  const renderForm = () => {
    switch (selectedType) {
      case 'password': return renderPasswordForm();
      case 'credit_card': return renderCreditCardForm();
      case 'secure_note': return renderSecureNoteForm();
      default: return renderPasswordForm();
    }
  };

  const itemTypes = [
    { key: 'password', label: 'Senha', icon: 'key' },
    { key: 'credit_card', label: 'Cartão', icon: 'card' },
    { key: 'secure_note', label: 'Nota', icon: 'document-text' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#00D4FF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Type selector */}
          {!editingItem && (
            <View style={styles.typeSelector}>
              {itemTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    selectedType === type.key && styles.typeButtonActive,
                  ]}
                  onPress={() => handleTypeChange(type.key as any)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={selectedType === type.key ? '#0A2540' : '#00D4FF'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.key && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Form content */}
          <View style={styles.content}>
            {renderForm()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#00D4FF',
    borderRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#0A2540',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  typeButtonActive: {
    backgroundColor: '#00D4FF',
  },
  typeButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: '#0A2540',
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  largeTextArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
});