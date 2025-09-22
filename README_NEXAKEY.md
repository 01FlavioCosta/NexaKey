# 🔐 NexaKey - Gerenciador de Senhas Completo

## 📱 Visão Geral
O **NexaKey** é um gerenciador de senhas profissional desenvolvido com React Native (Expo), FastAPI e MongoDB, oferecendo segurança de ponta-a-ponta e um modelo de negócio Freemium.

## ✨ Funcionalidades Principais

### 🔒 **Segurança Avançada**
- **Criptografia AES-256** para todos os dados do cofre
- **Derivação de chaves PBKDF2** para máxima segurança
- **Hash bcrypt** para senhas mestras
- **Modelo Zero-Knowledge** - nem mesmo o servidor acessa seus dados
- **Autenticação Biométrica** (impressão digital/Face ID)
- **Armazenamento Seguro** usando Expo SecureStore

### 👤 **Autenticação & Onboarding**
- **Onboarding Interativo** com 3 telas explicativas
- **Registro Seguro** com validação de força de senha
- **Login com Senha Mestra** ou biometria
- **Recuperação Biométrica** da senha mestra
- **Interface Responsiva** otimizada para mobile

### 🗃️ **Gerenciamento do Cofre**
- **Múltiplos Tipos de Itens**:
  - 🔑 Senhas com URLs e usuários
  - 💳 Cartões de crédito completos
  - 📝 Notas seguras
- **Busca Inteligente** por nome, usuário, website
- **Filtros por Categoria** (senhas, cartões, notas)
- **Visualização Segura** com toggle de visibilidade
- **Cópia Rápida** para área de transferência

### 🔐 **Gerador & Auditoria de Senhas**
- **Gerador de Senhas Avançado**:
  - Comprimento configurável (8-64 caracteres)
  - Exclusão de caracteres similares
  - Análise em tempo real da força
  - Estimativa de tempo para quebrar
- **Auditoria de Segurança Premium**:
  - Detecção de senhas fracas
  - Identificação de senhas reutilizadas
  - Verificação de senhas comprometidas
  - Pontuação geral de segurança (0-100)
  - Recomendações personalizadas

### 💰 **Modelo Freemium**
- **Plano Gratuito**:
  - Até 20 itens no cofre
  - 1 dispositivo apenas
  - Recursos básicos de segurança
- **NexaKey Plus (R$ 99,90/ano)**:
  - Itens ilimitados no cofre
  - Sincronização multi-dispositivo
  - Auditoria de segurança avançada
  - Compartilhamento seguro
  - Exportação de dados
  - Suporte prioritário

### ⚙️ **Configurações Avançadas**
- **Gerenciamento de Biometria**
- **Informações da Conta**
- **Status do Plano** (Gratuito/Premium)
- **Contador de Itens** com limites visuais
- **Sistema de Logout Seguro**

## 🏗️ **Arquitetura Técnica**

### **Frontend (React Native/Expo)**
- **Expo Router** para navegação file-based
- **Expo SecureStore** para armazenamento seguro
- **Expo LocalAuthentication** para biometria
- **React Hooks** para gerenciamento de estado
- **TypeScript** para type safety
- **StyleSheet** nativo para performance

### **Backend (FastAPI)**
- **FastAPI** framework moderno e rápido
- **JWT Authentication** com Bearer tokens
- **MongoDB** com motor assíncrono
- **Pydantic** para validação de dados
- **Argon2** para hash de senhas (backend)
- **CORS** configurado para mobile

### **Banco de Dados (MongoDB)**
- **Coleção Users**: dados de usuário e configurações
- **Coleção VaultItems**: itens criptografados do cofre
- **Índices Otimizados** para consultas rápidas
- **Modelo Zero-Knowledge**: apenas dados criptografados

## 🔧 **Recursos de Desenvolvimento**

### **Criptografia Client-Side**
```typescript
// Exemplo de criptografia
const encryptedData = EncryptionService.encrypt(
  JSON.stringify(itemData), 
  masterKey
);
```

### **Auditoria de Segurança**
```typescript
// Análise completa do cofre
const report = PasswordSecurityService.auditVault(vaultItems);
console.log(`Pontuação: ${report.averageStrength}/100`);
```

### **Biometria Nativa**
```typescript
// Autenticação biométrica
const success = await BiometricsService.authenticate(
  'Confirme sua identidade',
  'Usar senha mestra'
);
```

## 📊 **Estatísticas de Segurança**
- **Tempo de Quebra**: Estimativas precisas para cada senha
- **Padrões Detectados**: Sequências, repetições, palavras comuns
- **Base de Senhas Comprometidas**: Verificação contra vazamentos conhecidos
- **Pontuação Geral**: Algoritmo próprio de avaliação (0-100)

## 🚀 **URLs de Acesso**
- **Web Preview**: https://keymaster-app-4.preview.emergentagent.com
- **Backend API**: https://keymaster-app-4.preview.emergentagent.com/api
- **Documentação API**: https://keymaster-app-4.preview.emergentagent.com/api/docs

## 🎨 **Design System**
- **Cores Primárias**:
  - Azul Escuro: `#0A2540` (fundo principal)
  - Ciano: `#00D4FF` (destaques e botões)
  - Branco: `#FFFFFF` (textos principais)
- **Tipografia**: Sistema nativo otimizado
- **Ícones**: Expo Vector Icons (Ionicons)
- **Layout**: Mobile-first com design responsivo

## ✅ **Status de Implementação**

### **Completo ✅**
- [x] Sistema de autenticação completo
- [x] Criptografia end-to-end
- [x] Gerenciamento de cofre (CRUD)
- [x] Gerador de senhas avançado
- [x] Auditoria de segurança premium
- [x] Interface mobile responsiva
- [x] Modelo freemium funcional
- [x] Configurações de usuário
- [x] Biometria (mockada para desenvolvimento)

### **Para Produção 🔄**
- [ ] Integração real com In-App Purchases
- [ ] Sincronização entre dispositivos
- [ ] Compartilhamento seguro de senhas
- [ ] Sistema de backup automático
- [ ] Notificações push de segurança

## 📱 **Como Testar**
1. **Web**: Acesse a URL de preview
2. **Mobile**: Escaneie o QR code com Expo Go
3. **Fluxo**: Onboarding → Registro → Cofre → Configurações

## 🔒 **Segurança em Produção**
- Trocar JWT_SECRET por valor seguro
- Configurar HTTPS em produção
- Implementar rate limiting
- Adicionar logging de auditoria
- Configurar backup automático do MongoDB

---

**NexaKey** - Desenvolvido com ❤️ para oferecer a melhor experiência em gerenciamento de senhas mobile.