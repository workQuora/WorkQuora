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
import { useLanguage, LocaleType } from '../../services/i18n';
import { useTheme } from '../theme/theme';

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { locale, setLocale, t } = useLanguage();
  const { colors } = useTheme();
  const [selectedLang, setSelectedLang] = useState<LocaleType | null>(locale || null);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Feather name="refresh-cw" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.primary }]}>WorkQuora</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Hero */}
        <View style={styles.heroSection}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome</Text>
          <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>
            Choose your preferred language to get started.
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
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  isSelected && { backgroundColor: colors.accent },
                ]}
                onPress={() => handleSelectLanguage(lang.id)}
              >
                <View style={styles.iconContainer}>
                  <Feather
                    name={lang.icon}
                    size={26}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text style={[styles.cardLabel, { color: isSelected ? colors.primary : colors.text }]}>
                  {lang.label}
                </Text>
                <Text style={[styles.cardNativeLabel, { color: colors.textMuted }]}>{lang.nativeLabel}</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Feather name="check-circle" size={16} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Illustration Section */}
        <View style={[styles.illustrationCard, { borderColor: colors.border }]}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6Qu1vg5HJ-QFo0EW7PsRNmHDeIvluYIeyJMgKjwX5E7v8F6cPt7oSPR9lFSyUNEMQI2AGdgLaJl-510-6sqbfJlyp1jY3sY94T9wbzNuOYjLqzKeudBt7ANzjpbul5h7TPtmsw3jJPypVFra8S03HVIY5SkZb8PQQaoEXs844yfqtwyMbq8q778gYAiBJnSlcgysr-7k0NGjzOyxIFHC9_xgkqUs9k4BAHZNTSC0jGChs9Q8CK09_u8Kx7EZyBLO2-neV1UOLMPky' }}
            style={styles.illustrationImage}
            resizeMode="cover"
          />
        </View>
      </ScrollView>

      {/* Footer / CTA */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: selectedLang ? colors.primary : colors.grayMedium },
          ]}
          disabled={!selectedLang}
          onPress={handleNext}
        >
          <Text style={[styles.nextButtonText, { color: colors.white }]}>
            Next →
          </Text>
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          By continuing, you agree to WorkQuora’s Terms and Conditions.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  heroSection: {
    marginTop: 24,
    marginBottom: 24,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    height: 110,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardNativeLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  illustrationCard: {
    marginTop: 24,
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  nextButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
