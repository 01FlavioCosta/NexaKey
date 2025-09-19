import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { VaultService } from '../services/VaultService';
import { PasswordSecurityService } from '../utils/passwordSecurity';

interface SecurityAuditScreenProps {
  onClose: () => void;
}

export const SecurityAuditScreen: React.FC<SecurityAuditScreenProps> = ({ onClose }) => {
  const { user, masterKey } = useAuth();
  const [auditReport, setAuditReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const vaultService = new VaultService();

  useEffect(() => {
    if (user?.is_premium) {
      performSecurityAudit();
    }
  }, []);

  const performSecurityAudit = async () => {
    try {
      setIsLoading(true);
      
      // Get all vault items
      const vaultItems = await vaultService.getVaultItems(masterKey!);
      
      // Perform security audit
      const report = PasswordSecurityService.auditVault(vaultItems);
      setAuditReport(report);
      
    } catch (error) {
      console.error('Security audit failed:', error);
      Alert.alert('Erro', 'Falha ao realizar auditoria de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'weak': return 'warning';
      case 'reused': return 'copy';
      case 'compromised': return 'alert-circle';
      case 'old': return 'time';
      default: return 'information-circle';
    }
  };

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#FFC107';
      default: return '#2196F3';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'CRÍTICO';
      case 'high': return 'ALTO';
      case 'medium': return 'MÉDIO';
      case 'low': return 'BAIXO';
      default: return 'INFO';
    }
  };

  const getOverallSecurityScore = () => {
    if (!auditReport) return 0;
    
    const criticalIssues = auditReport.issues.filter((i: any) => i.severity === 'critical').length;
    const highIssues = auditReport.issues.filter((i: any) => i.severity === 'high').length;
    const mediumIssues = auditReport.issues.filter((i: any) => i.severity === 'medium').length;
    
    let score = 100;
    score -= criticalIssues * 20;
    score -= highIssues * 10;
    score -= mediumIssues * 5;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    if (score >= 20) return '#FF5722';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Ruim';
    return 'Crítica';
  };

  if (!user?.is_premium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#00D4FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Auditoria de Segurança</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.premiumRequired}>
          <Ionicons name="diamond" size={64} color="#FF9800" />
          <Text style={styles.premiumTitle}>Recurso Premium</Text>
          <Text style={styles.premiumDescription}>
            A auditoria de segurança está disponível apenas para usuários NexaKey Plus
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !auditReport) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#00D4FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Auditoria de Segurança</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#00D4FF" />
          <Text style={styles.loadingText}>Analisando segurança...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const securityScore = getOverallSecurityScore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#00D4FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auditoria de Segurança</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={performSecurityAudit}>
          <Ionicons name="refresh" size={24} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Security Score */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: getScoreColor(securityScore) }]}>
              {securityScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Pontuação de Segurança</Text>
            <Text style={[styles.scoreLabel, { color: getScoreColor(securityScore) }]}>
              {getScoreLabel(securityScore)}
            </Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{auditReport.totalPasswords}</Text>
            <Text style={styles.statLabel}>Total de Senhas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF5722' }]}>
              {auditReport.weakPasswords}
            </Text>
            <Text style={styles.statLabel}>Senhas Fracas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>
              {auditReport.reusedPasswords}
            </Text>
            <Text style={styles.statLabel}>Reutilizadas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#F44336' }]}>
              {auditReport.compromisedPasswords}
            </Text>
            <Text style={styles.statLabel}>Comprometidas</Text>
          </View>
        </View>

        {/* Issues */}
        {auditReport.issues.length > 0 && (
          <View style={styles.issuesSection}>
            <Text style={styles.sectionTitle}>Problemas Encontrados</Text>
            
            {auditReport.issues.map((issue: any, index: number) => (
              <View key={index} style={styles.issueCard}>
                <View style={styles.issueHeader}>
                  <View style={styles.issueIconContainer}>
                    <Ionicons 
                      name={getIssueIcon(issue.type)} 
                      size={24} 
                      color={getIssueColor(issue.severity)} 
                    />
                  </View>
                  <View style={styles.issueInfo}>
                    <Text style={styles.issueTitle}>{issue.title}</Text>
                    <Text style={styles.issueDescription}>{issue.description}</Text>
                  </View>
                  <View style={[
                    styles.severityBadge, 
                    { backgroundColor: getIssueColor(issue.severity) }
                  ]}>
                    <Text style={styles.severityText}>
                      {getSeverityText(issue.severity)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.recommendationText}>
                  💡 {issue.recommendation}
                </Text>
                
                {issue.affectedItems.length > 0 && (
                  <View style={styles.affectedItems}>
                    <Text style={styles.affectedTitle}>Itens afetados:</Text>
                    {issue.affectedItems.slice(0, 3).map((item: string, idx: number) => (
                      <Text key={idx} style={styles.affectedItem}>• {item}</Text>
                    ))}
                    {issue.affectedItems.length > 3 && (
                      <Text style={styles.affectedMore}>
                        +{issue.affectedItems.length - 3} mais
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {auditReport.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Recomendações Gerais</Text>
            {auditReport.recommendations.map((rec: string, index: number) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* No Issues */}
        {auditReport.issues.length === 0 && (
          <View style={styles.noIssuesContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#4CAF50" />
            <Text style={styles.noIssuesTitle}>Parabéns!</Text>
            <Text style={styles.noIssuesText}>
              Nenhum problema crítico de segurança foi encontrado no seu cofre.
            </Text>
          </View>
        )}
      </ScrollView>
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
  refreshButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  premiumRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A365D',
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A365D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  issuesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  issueCard: {
    backgroundColor: '#1A365D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  issueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  issueDescription: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: 14,
    color: '#00D4FF',
    marginBottom: 8,
  },
  affectedItems: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  affectedTitle: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '500',
    marginBottom: 8,
  },
  affectedItem: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  affectedMore: {
    fontSize: 12,
    color: '#00D4FF',
    fontStyle: 'italic',
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A365D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  noIssuesContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noIssuesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  noIssuesText: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
});