// Lista de senhas comumente comprometidas (versão reduzida para demo)
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345', '1234567',
  'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome',
  'monkey', '1234567890', 'dragon', 'passw0rd', 'master', 'hello',
  'freedom', 'whatever', 'qazwsx', 'trustno1', 'jordan23', 'harley',
  'robert', 'matthew', 'jordan', 'michelle', 'love', 'sunshine'
];

// Padrões comuns que tornam senhas fracas
const WEAK_PATTERNS = [
  /^(.)\1+$/, // Caracteres repetidos: 111111, aaaa
  /123456|654321/, // Sequências numéricas
  /qwerty|asdfg/, // Sequências de teclado
  /password|senha/i, // Palavras óbvias
  /^\d{4,}$/, // Apenas números
  /^[a-zA-Z]+$/, // Apenas letras
];

interface PasswordAnalysis {
  password: string;
  score: number;
  issues: string[];
  recommendations: string[];
  isCompromised: boolean;
  strength: 'Muito Fraca' | 'Fraca' | 'Moderada' | 'Forte' | 'Muito Forte';
}

interface VaultSecurityReport {
  totalPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  compromisedPasswords: number;
  oldPasswords: number;
  averageStrength: number;
  issues: SecurityIssue[];
  recommendations: string[];
}

interface SecurityIssue {
  type: 'weak' | 'reused' | 'compromised' | 'old';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedItems: string[];
  recommendation: string;
}

export class PasswordSecurityService {
  // Análise individual de senha
  static analyzePassword(password: string, itemName: string = ''): PasswordAnalysis {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Verificar comprimento
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    } else {
      issues.push('Senha muito curta');
      recommendations.push('Use pelo menos 8 caracteres');
    }

    // Verificar diversidade de caracteres
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      issues.push('Faltam letras minúsculas');
      recommendations.push('Inclua letras minúsculas');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      issues.push('Faltam letras maiúsculas');
      recommendations.push('Inclua letras maiúsculas');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('Faltam números');
      recommendations.push('Inclua números');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      issues.push('Faltam símbolos');
      recommendations.push('Inclua símbolos (!@#$%^&*)');
    }

    // Verificar padrões fracos
    const hasWeakPattern = WEAK_PATTERNS.some(pattern => pattern.test(password));
    if (hasWeakPattern) {
      score -= 2;
      issues.push('Contém padrões previsíveis');
      recommendations.push('Evite sequências e repetições');
    }

    // Verificar se está na lista de senhas comprometidas
    const isCompromised = COMMON_PASSWORDS.includes(password.toLowerCase());
    if (isCompromised) {
      score -= 3;
      issues.push('Senha comprometida conhecida');
      recommendations.push('Use uma senha única e complexa');
    }

    // Verificar caracteres repetidos
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      issues.push('Contém caracteres repetidos');
      recommendations.push('Evite repetir caracteres');
    }

    // Determinar força da senha
    let strength: PasswordAnalysis['strength'] = 'Muito Fraca';
    if (score >= 6) strength = 'Muito Forte';
    else if (score >= 5) strength = 'Forte';
    else if (score >= 4) strength = 'Moderada';
    else if (score >= 2) strength = 'Fraca';

    return {
      password,
      score: Math.max(0, score),
      issues,
      recommendations,
      isCompromised,
      strength,
    };
  }

  // Auditoria completa do cofre
  static auditVault(vaultItems: any[]): VaultSecurityReport {
    const passwordItems = vaultItems.filter(item => 
      item.item_type === 'password' && item.decrypted_data.password
    );

    const analyses = passwordItems.map(item => ({
      item,
      analysis: this.analyzePassword(item.decrypted_data.password, item.decrypted_data.name)
    }));

    // Identificar senhas reutilizadas
    const passwordCounts = new Map<string, string[]>();
    analyses.forEach(({ item, analysis }) => {
      const pwd = analysis.password;
      if (!passwordCounts.has(pwd)) {
        passwordCounts.set(pwd, []);
      }
      passwordCounts.get(pwd)!.push(item.decrypted_data.name || 'Item sem nome');
    });

    const reusedPasswords = Array.from(passwordCounts.entries())
      .filter(([_, items]) => items.length > 1);

    // Calcular estatísticas
    const weakPasswords = analyses.filter(({ analysis }) => 
      analysis.score < 4 || analysis.isCompromised
    ).length;

    const compromisedPasswords = analyses.filter(({ analysis }) => 
      analysis.isCompromised
    ).length;

    // Senhas antigas (mais de 90 dias - simulado)
    const oldPasswords = analyses.filter(({ item }) => {
      const createdAt = new Date(item.created_at);
      const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 90;
    }).length;

    const averageStrength = analyses.length > 0 
      ? analyses.reduce((sum, { analysis }) => sum + analysis.score, 0) / analyses.length
      : 0;

    // Gerar problemas de segurança
    const issues: SecurityIssue[] = [];

    // Senhas fracas
    if (weakPasswords > 0) {
      const weakItems = analyses
        .filter(({ analysis }) => analysis.score < 4)
        .map(({ item }) => item.decrypted_data.name || 'Item sem nome');

      issues.push({
        type: 'weak',
        severity: weakPasswords > 5 ? 'critical' : weakPasswords > 2 ? 'high' : 'medium',
        title: 'Senhas Fracas Detectadas',
        description: `${weakPasswords} senhas fracas encontradas no seu cofre`,
        affectedItems: weakItems,
        recommendation: 'Atualize essas senhas para versões mais seguras usando o gerador de senhas',
      });
    }

    // Senhas reutilizadas
    if (reusedPasswords.length > 0) {
      const reusedItems = reusedPasswords.flatMap(([_, items]) => items);
      
      issues.push({
        type: 'reused',
        severity: reusedPasswords.length > 3 ? 'high' : 'medium',
        title: 'Senhas Reutilizadas',
        description: `${reusedItems.length} contas usando senhas duplicadas`,
        affectedItems: reusedItems,
        recommendation: 'Use senhas únicas para cada conta para melhor segurança',
      });
    }

    // Senhas comprometidas
    if (compromisedPasswords > 0) {
      const compromisedItems = analyses
        .filter(({ analysis }) => analysis.isCompromised)
        .map(({ item }) => item.decrypted_data.name || 'Item sem nome');

      issues.push({
        type: 'compromised',
        severity: 'critical',
        title: 'Senhas Comprometidas',
        description: `${compromisedPasswords} senhas conhecidamente vazadas detectadas`,
        affectedItems: compromisedItems,
        recommendation: 'ALTERE IMEDIATAMENTE essas senhas comprometidas',
      });
    }

    // Senhas antigas
    if (oldPasswords > 0) {
      issues.push({
        type: 'old',
        severity: 'low',
        title: 'Senhas Antigas',
        description: `${oldPasswords} senhas não foram alteradas há mais de 90 dias`,
        affectedItems: [],
        recommendation: 'Considere atualizar senhas antigas periodicamente',
      });
    }

    // Gerar recomendações gerais
    const recommendations: string[] = [];
    
    if (averageStrength < 4) {
      recommendations.push('Melhore a força geral das suas senhas');
    }
    
    if (passwordItems.length < 10) {
      recommendations.push('Use o NexaKey para todas as suas contas online');
    }
    
    recommendations.push('Ative a autenticação de dois fatores quando disponível');
    recommendations.push('Use o gerador de senhas para criar senhas seguras');

    return {
      totalPasswords: passwordItems.length,
      weakPasswords,
      reusedPasswords: reusedItems.length,
      compromisedPasswords,
      oldPasswords,
      averageStrength: Math.round(averageStrength * 100) / 100,
      issues,
      recommendations,
    };
  }

  // Gerar senha segura baseada em critérios
  static generateSecurePassword(
    length: number = 16,
    excludeSimilar: boolean = true,
    includeSymbols: boolean = true
  ): string {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    if (includeSymbols) {
      chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    
    if (excludeSimilar) {
      // Remove caracteres similares que podem causar confusão
      chars = chars.replace(/[il1Lo0O]/g, '');
    }

    let password = '';
    const charArray = chars.split('');
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charArray.length);
      password += charArray[randomIndex];
    }

    // Garantir que a senha tenha pelo menos um de cada tipo
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = includeSymbols ? /[^a-zA-Z0-9]/.test(password) : true;

    if (!hasLower || !hasUpper || !hasNumber || !hasSymbol) {
      // Regenerar se não atender aos critérios
      return this.generateSecurePassword(length, excludeSimilar, includeSymbols);
    }

    return password;
  }

  // Estimar tempo para quebrar senha
  static estimateCrackTime(password: string): string {
    const charsetSize = this.getCharsetSize(password);
    const combinations = Math.pow(charsetSize, password.length);
    
    // Assumindo 1 bilhão de tentativas por segundo
    const secondsToCrack = combinations / (2 * 1000000000);
    
    if (secondsToCrack < 60) return 'Menos de 1 minuto';
    if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutos`;
    if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} horas`;
    if (secondsToCrack < 2592000) return `${Math.round(secondsToCrack / 86400)} dias`;
    if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 2592000)} meses`;
    if (secondsToCrack < 3153600000) return `${Math.round(secondsToCrack / 31536000)} anos`;
    
    return 'Milhões de anos';
  }

  private static getCharsetSize(password: string): number {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/[0-9]/.test(password)) size += 10;
    if (/[^a-zA-Z0-9]/.test(password)) size += 32; // Símbolos aproximados
    return size;
  }
}