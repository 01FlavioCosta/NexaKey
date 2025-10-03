import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { RegisterForm } from './RegisterForm';
import { useNavigation } from '@react-navigation/native'; // Adicionado para navegação

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Bem-vindo ao NexaKey',
    subtitle: 'Seu gerenciador de senhas seguro',
    description: 'Mantenha todas as suas senhas protegidas com criptografia militar. Uma senha mestra para acessar tudo.',
    icon: 'shield-checkmark',
  },
  {
    id: 2,
    title: 'Segurança Avançada',
    subtitle: 'Criptografia de ponta-a-ponta',
    description: 'Seus dados são criptografados no seu dispositivo. Nem mesmo nós conseguimos acessar suas informações.',
    icon: 'lock-closed',
  },
  {
    id: 3,
    title: 'Comece Agora',
    subtitle: 'Crie sua conta e senha mestra',
    description: 'Sua senha mestra é a única chave para seus dados. Certifique-se de memorizá-la bem!',
    icon: 'key',
  },
];

export const OnboardingScreen = () => {
  const navigation = useNavigation(); // Adicionado para redirecionar
  const [currentPage, setCurrentPage] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isFirstTime, setIsFirstTime] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem("isFirstTime") === "false" ? false : true;
    }
    return true;
  });

  // Verifica se já tem usuário salvo e redireciona
  useEffect(() => {
    const checkUser = async () => {
      const db = await indexedDB.open('NexaKeyDB', 1);
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const user = await store.get('iflavicosta@hotmail.com.br');
      if (user) {
        setIsFirstTime(false);
        localStorage.setItem('isFirstTime', 'false');
        navigation.navigate('Dashboard'); // Vai direto para dashboard se já registrado
      }
    };
    checkUser();
  }, []);

  const navigateToLogin = () => {
    setIsFirstTime(false); // Marca que não é a primeira vez
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('isFirstTime', 'false'); // Persiste o estado
    }
    setShowRegister(false);
    navigation.navigate('Login'); // Redireciona para tela de login
  };

  const nextPage = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextIndex = currentPage + 1;
      setCurrentPage(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      setShowRegister(true);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      const prevIndex = currentPage - 1;
      setCurrentPage(prevIndex);
      scrollViewRef.current?.scrollTo({ x: prevIndex * width, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(pageIndex);
  };

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={styles.page}>
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={80} color="#00D4FF" />
              </View>
              
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Page indicators */}
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentPage === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {currentPage > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevPage}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {currentPage === onboardingData.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login link */}
      <View style={styles.loginLinkContainer}>
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={navigateToLogin} // Usa a função correta
        >
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
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width,
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#B0BEC5',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#0A2540',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  loginLink: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginLinkText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});