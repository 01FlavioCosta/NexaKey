import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistência RN
import { useNavigation } from '@react-navigation/native'; // Navegação

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
  const navigation = useNavigation();
  const [currentPage, setCurrentPage] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isFirstTime, setIsFirstTime] = useState(true); // Inicial true, carrega abaixo

  // Carrega se é first time do AsyncStorage
  useEffect(() => {
    const loadFirstTime = async () => {
      const saved = await AsyncStorage.getItem('isFirstTime');
      setIsFirstTime(saved === 'false' ? false : true);
    };
    loadFirstTime();
  }, []);

  // Verifica usuário salvo e redireciona
  useEffect(() => {
    const checkUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setIsFirstTime(false);
        await AsyncStorage.setItem('isFirstTime', 'false');
        navigation.navigate('Dashboard');
      }
    };
    checkUser();
  }, []);

  const navigateToLogin = async () => {
    setIsFirstTime(false);
    await AsyncStorage.setItem('isFirstTime', 'false');
    setShowRegister(false);
    navigation.navigate('Login'); // Redireciona para login
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

      <View style={styles.loginLinkContainer}>
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={navigateToLogin}
        >
          <Text style={styles.loginLinkText}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... (styles iguais ao anterior, cole do código antigo se necessário)
const styles = StyleSheet.create({
  // Cole os styles do seu código anterior aqui para manter o visual
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
  // ... (o resto dos styles)
});