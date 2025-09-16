import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: 'infinite',
      title: 'Armazenamento Ilimitado',
      description: 'Salve quantas senhas, cartões e notas quiser',
    },
    {
      icon: 'sync',
      title: 'Sincronização em Múltiplos Dispositivos',
      description: 'Acesse seu cofre em todos os seus dispositivos',
    },
    {
      icon: 'share',
      title: 'Compartilhamento Seguro',
      description: 'Compartilhe senhas com familiares de forma segura',
    },
    {
      icon: 'shield-outline',
      title: 'Auditoria de Segurança',
      description: 'Análise automática de senhas fracas e comprometidas',
    },
    {
      icon: 'headset',
      title: 'Suporte Prioritário',
      description: 'Atendimento prioritário para usuários Premium',
    },
    {
      icon: 'cloud-upload',
      title: 'Backup Automático',
      description: 'Seus dados sempre seguros na nuvem',
    },
  ];

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      
      // Mock purchase flow - in real app, this would integrate with Expo In-App Purchases
      Alert.alert(
        'Compra Simulada',
        `Plano ${selectedPlan === 'annual' ? 'Anual' : 'Mensal'} de NexaKey Plus por R$ ${selectedPlan === 'annual' ? '99,90' : '12,90'} ativado com sucesso!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              // Here you would update the user's premium status
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar a compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#00D4FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade para Premium</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="diamond" size={60} color="#00D4FF" />
            </View>
            <Text style={styles.heroTitle}>NexaKey Plus</Text>
            <Text style={styles.heroSubtitle}>
              Desbloqueie todo o potencial do seu gerenciador de senhas
            </Text>
          </View>

          {/* Plan selector */}
          <View style={styles.planSelector}>
            <TouchableOpacity
              style={[
                styles.planButton,
                selectedPlan === 'annual' && styles.planButtonActive,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planHeader}>
                <Text style={[
                  styles.planTitle,
                  selectedPlan === 'annual' && styles.planTitleActive,
                ]}>
                  Plano Anual
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>Mais popular</Text>
                </View>
              </View>
              <Text style={[
                styles.planPrice,
                selectedPlan === 'annual' && styles.planPriceActive,
              ]}>
                R$ 99,90/ano
              </Text>
              <Text style={[
                styles.planSubtext,
                selectedPlan === 'annual' && styles.planSubtextActive,
              ]}>
                Equivale a R$ 8,33/mês
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planButton,
                selectedPlan === 'monthly' && styles.planButtonActive,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={[
                styles.planTitle,
                selectedPlan === 'monthly' && styles.planTitleActive,
              ]}>
                Plano Mensal
              </Text>
              <Text style={[
                styles.planPrice,
                selectedPlan === 'monthly' && styles.planPriceActive,
              ]}>
                R$ 12,90/mês
              </Text>
              <Text style={[
                styles.planSubtext,
                selectedPlan === 'monthly' && styles.planSubtextActive,
              ]}>
                Cancele quando quiser
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features list */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>O que você ganha:</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#00D4FF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Comparison */}
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Plano Gratuito vs Premium</Text>
            
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature}>Itens no cofre</Text>
                <Text style={styles.comparisonFree}>20 itens</Text>
                <Text style={styles.comparisonPremium}>Ilimitado</Text>
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature}>Dispositivos</Text>
                <Text style={styles.comparisonFree}>1 dispositivo</Text>
                <Text style={styles.comparisonPremium}>Ilimitado</Text>
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature}>Sincronização</Text>
                <Ionicons name="close" size={16} color="#FF5722" />
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature}>Compartilhamento</Text>
                <Ionicons name="close" size={16} color="#FF5722" />
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              </View>
              
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature}>Auditoria de segurança</Text>
                <Ionicons name="close" size={16} color="#FF5722" />
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              </View>
            </View>
          </View>

          {/* Security note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Seus dados continuam protegidos com criptografia de ponta-a-ponta
            </Text>
          </View>
        </ScrollView>

        {/* Purchase button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={isLoading}
          >
            <Text style={styles.purchaseButtonText}>
              {isLoading 
                ? 'Processando...' 
                : `Assinar por R$ ${selectedPlan === 'annual' ? '99,90/ano' : '12,90/mês'}`
              }
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.footerText}>
            Cancele a qualquer momento. Seus dados ficam protegidos.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
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
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
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
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  planSelector: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  planButton: {
    backgroundColor: '#1A365D',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planButtonActive: {
    borderColor: '#00D4FF',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  planTitleActive: {
    color: '#00D4FF',
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  planPriceActive: {
    color: '#00D4FF',
  },
  planSubtext: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  planSubtextActive: {
    color: '#B0BEC5',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
  },
  comparisonSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
  },
  comparisonTable: {
    backgroundColor: '#1A365D',
    borderRadius: 12,
    padding: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: 'white',
  },
  comparisonFree: {
    flex: 1,
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  comparisonPremium: {
    flex: 1,
    fontSize: 12,
    color: '#00D4FF',
    textAlign: 'center',
    fontWeight: '500',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  purchaseButton: {
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  footerText: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 18,
  },
});