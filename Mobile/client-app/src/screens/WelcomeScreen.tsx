import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage, LocaleType } from '../services/i18n';

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { locale, setLocale, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LocaleType | null>(null);

  const languages = [
    { id: 'en' as LocaleType, label: 'English', nativeLabel: 'English', icon: 'globe' as const },
    { id: 'hi' as LocaleType, label: 'हिंदी', nativeLabel: 'Hindi', icon: 'type' as const },
    { id: 'bn' as LocaleType, label: 'বাংলা', nativeLabel: 'Bengali', icon: 'edit-3' as const },
    { id: 'bho' as LocaleType, label: 'भोजपुरी', nativeLabel: 'Bhojpuri', icon: 'message-circle' as const },
  ];

  const handleSelectLanguage = (langId: LocaleType) => {
    setSelectedLang(langId);
    setLocale(langId);
  };

  const handleNext = () => {
    if (selectedLang) {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Feather name="refresh-cw" size={24} color="#1e3a8a" />
        <Text style={styles.headerTitle}>WorkQuora</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSub}>
            Choose your preferred language to get started with finding local services.
          </Text>
        </View>

        {/* Bento Grid */}
        <View style={styles.grid}>
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.card,
                  isSelected && styles.cardActive,
                ]}
                onPress={() => handleSelectLanguage(lang.id)}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconActive]}>
                  <Feather
                    name={lang.icon}
                    size={28}
                    color={isSelected ? '#1e3a8a' : '#8e8e8e'}
                  />
                </View>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                  {lang.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Feather name="check-circle" size={16} color="#1e3a8a" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Illustration Section */}
        <View style={styles.illustrationCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6Qu1vg5HJ-QFo0EW7PsRNmHDeIvluYIeyJMgKjwX5E7v8F6cPt7oSPR9lFSyUNEMQI2AGdgLaJl-510-6sqbfJlyp1jY3sY94T9wbzNuOYjLqzKeudBt7ANzjpbul5h7TPtmsw3jJPypVFra8S03HVIY5SkZb8PQQaoEXs844yfqtwyMbq8q778gYAiBJnSlcgysr-7k0NGjzOyxIFHC9_xgkqUs9k4BAHZNTSC0jGChs9Q8CK09_u8Kx7EZyBLO2-neV1UOLMPky' }}
            style={styles.illustrationImage}
            resizeMode="cover"
          />
          <View style={styles.gradientOverlay} />
        </View>
      </ScrollView>

      {/* Footer / CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !selectedLang && styles.nextButtonDisabled]}
          disabled={!selectedLang}
          onPress={handleNext}
        >
          <Text style={[styles.nextButtonText, !selectedLang && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          By continuing, you agree to WorkQuora’s Terms and Conditions.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  heroSection: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: '47%',
    height: 120,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#eff7ff',
    borderWidth: 1.5,
  },
  iconContainer: {
    marginBottom: 8,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardLabelActive: {
    color: '#1e3a8a',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  illustrationCard: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 32,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(30, 58, 138, 0.1)',
  },
  footer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 12,
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonTextDisabled: {
    color: '#0f172a',
  },
  footerNote: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
});
