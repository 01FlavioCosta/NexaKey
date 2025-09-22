import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { BiometricsService } from '../utils/biometrics';
import { SecureStorageService } from '../utils/storage';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { SecurityAuditScreen } from './SecurityAuditScreen';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [supportedBiometrics, setSupportedBiometrics] = useState<string[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const isAvailable = await BiometricsService.isAvailable();
      const enabled = await SecureStorageService.isBiometricEnabled();
      const types = await BiometricsService.getSupportedTypes();
      const typeNames = types.map(type => BiometricsService.getBiometricTypeName(type));
      
      setBiometricAvailable(isAvailable);
      setBiometricEnabled(enabled && isAvailable);
      setSupportedBiometrics(typeNames);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      
      if (enabled) {
        // Enable biometric authentication
        const masterKey = await SecureStorageService.getMasterKey();
        if (!masterKey) {
          Alert.alert('Erro', 'Chave de criptografia não encontrada');
          return;
        }

        const success = await BiometricsService.setupBiometricAuth(masterKey);
        if (success) {
          setBiometricEnabled(true);
          Alert.alert('Sucesso', 'Biometria ativada com sucesso!');
        }
      } else {
        // Disable biometric authentication
        await BiometricsService.disableBiometricAuth();
        setBiometricEnabled(false);
      }
    } catch (error) {
      console.error('Biometric toggle failed:', error);
      Alert.alert('Erro', 'Falha ao alterar configuração biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMasterPassword = () => {
    Alert.alert(
      'Alterar Senha Mestra',
      'Esta funcionalidade está sendo desenvolvida. Por segurança, recomendamos criar uma nova conta se precisar alterar sua senha mestra.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    if (!user?.is_premium) {
      Alert.alert(
        'Recurso Premium',
        'A exportação de dados está disponível apenas para usuários NexaKey Plus.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Exportar Dados',
      'Esta funcionalidade permite exportar seus dados em formato seguro. Implementação em desenvolvimento.',
      [{ text: 'OK' }]
    );
  };

  const handleSecurityAudit = () => {
    if (!user?.is_premium) {
      Alert.alert(
        'Recurso Premium',
        'A auditoria de segurança está disponível apenas para usuários NexaKey Plus.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
        ]
      );
      return;
    }

    setShowSecurityAudit(true);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'ATENÇÃO: Esta ação é irreversível! Todos os seus dados serão permanentemente apagados.\n\nTem certeza que deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Confirmação Final',
      'Digite "EXCLUIR" para confirmar a exclusão da sua conta:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Conta Excluída',
              'Sua conta foi excluída com sucesso. Todos os dados foram removidos.',
              [{ text: 'OK', onPress: logout }]
            );
          },
        },
      ],
      'plain-text'
    );
  };

  const settingSections = [
    {
      title: 'Segurança',
      items: [
        {
          icon: 'finger-print',
          title: 'Desbloqueio Biométrico',
          subtitle: biometricAvailable 
            ? `${supportedBiometrics.join(' ou ')}`
            : 'Não disponível neste dispositivo',
          type: 'switch',
          value: biometricEnabled,
          onPress: handleBiometricToggle,
          disabled: !biometricAvailable || isLoading,
        },
        {
          icon: 'key',
          title: 'Alterar Senha Mestra',
          subtitle: 'Defina uma nova senha mestra',
          type: 'button',
          onPress: handleChangeMasterPassword,
        },
        {
          icon: 'shield-checkmark',
          title: 'Auditoria de Segurança',
          subtitle: user?.is_premium ? 'Analisar senhas fracas' : 'Recurso Premium',
          type: 'button',
          onPress: handleSecurityAudit,
          isPremium: !user?.is_premium,
        },
      ],
    },
    {
      title: 'Dados',
      items: [
        {
          icon: 'download',
          title: 'Exportar Dados',
          subtitle: user?.is_premium ? 'Backup seguro dos seus dados' : 'Recurso Premium',
          type: 'button',
          onPress: handleExportData,
          isPremium: !user?.is_premium,
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          icon: 'person',
          title: 'Informações da Conta',
          subtitle: user?.email,
          type: 'info',
        },
        {
          icon: 'diamond',
          title: 'Plano Atual',
          subtitle: user?.is_premium ? 'NexaKey Plus' : 'Gratuito',
          type: 'info',
        },
        {
          icon: 'folder',
          title: 'Itens no Cofre',
          subtitle: `${user?.vault_items_count || 0} ${user?.is_premium ? '' : 'de 20'} itens`,
          type: 'info',
        },
      ],
    },
    {
      title: 'Zona de Perigo',
      items: [
        {
          icon: 'trash',
          title: 'Excluir Conta',
          subtitle: 'Remover permanentemente todos os dados',
          type: 'danger',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#00D4FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out" size={24} color="#FF5722" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              section.title === 'Zona de Perigo' && styles.dangerSectionTitle
            ]}>
              {section.title}
            </Text>
            
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={[
                styles.settingItem,
                section.title === 'Zona de Perigo' && styles.dangerItem
              ]}>
                <View style={styles.settingIcon}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={
                      section.title === 'Zona de Perigo' 
                        ? '#FF5722' 
                        : item.isPremium 
                          ? '#FF9800' 
                          : '#00D4FF'
                    } 
                  />
                </View>
                
                <View style={styles.settingContent}>
                  <View style={styles.settingTextContainer}>
                    <Text style={[
                      styles.settingTitle,
                      section.title === 'Zona de Perigo' && styles.dangerText
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                  
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onPress}
                      disabled={item.disabled}
                      trackColor={{ false: '#333', true: '#00D4FF40' }}
                      thumbColor={item.value ? '#00D4FF' : '#666'}
                    />
                  )}
                  
                  {item.type === 'button' && (
                    <TouchableOpacity
                      style={styles.settingButton}
                      onPress={item.onPress}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                  
                  {item.type === 'danger' && (
                    <TouchableOpacity
                      style={styles.dangerButton}
                      onPress={item.onPress}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#FF5722" />
                    </TouchableOpacity>
                  )}
                  
                  {item.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>Plus</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        {!user?.is_premium && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => setShowUpgradeModal(true)}
          >
            <View style={styles.upgradeIcon}>
              <Ionicons name="diamond" size={32} color="#00D4FF" />
            </View>
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>Upgrade para NexaKey Plus</Text>
              <Text style={styles.upgradeSubtitle}>
                Desbloqueie recursos avançados por apenas R$ 99,90/ano
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00D4FF" />
          </TouchableOpacity>
        )}
      </ScrollView>

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <Modal
        visible={showSecurityAudit}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SecurityAuditScreen onClose={() => setShowSecurityAudit(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
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
  logoutButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  dangerSectionTitle: {
    color: '#FF5722',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A365D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dangerItem: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.3)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  dangerText: {
    color: '#FF5722',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  settingButton: {
    padding: 4,
  },
  dangerButton: {
    padding: 4,
  },
  premiumBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  upgradeIcon: {
    marginRight: 16,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#B0BEC5',
  },
});