import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginUserSession } from '../store/authSlice';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../services/i18n';

interface TermsScreenProps {
  route: any;
  navigation: any;
}

const termsText = {
  en: {
    title: 'Terms of Service',
    welcomeTitle: '1. Welcome to WorkQuora',
    welcomeDesc: 'By registering as a Worker on WorkQuora, you agree to comply with and be bound by the following terms. You agree to complete jobs you accept in a professional and timely manner.',
    payoutTitle: '2. Earnings & Escrow',
    payoutDesc: 'Client funds are securely deposited in Escrow. Once the job is verified, the funds will be released to your wallet. You can withdraw your earnings to your bank account after KYC verification.',
    conductTitle: '3. Worker Code of Conduct',
    conductDesc: 'You must behave professionally with clients. Fraud, demanding extra off-platform payments, or low-quality work will lead to immediate account suspension.',
    agreeTick: 'I agree to all Terms and Conditions.',
    agreeBtn: 'Agree & Continue',
    permCameraTitle: 'Camera Access Required',
    permCameraDesc: 'WorkQuora requires camera permission to capture KYC documents and take profile photos.',
    permNotifyTitle: 'Notification Access Required',
    permNotifyDesc: 'WorkQuora requires notification permission to alert you when clients post gigs nearby or send messages.',
    btnAllow: 'Allow',
    btnDeny: 'Don\'t Allow',
    readyTitle: 'Account Ready',
    readyDesc: 'Thank you! Your terms agreement and permission settings are complete.',
  },
  hi: {
    title: 'नियम और शर्तें',
    welcomeTitle: '1. WorkQuora में आपका स्वागत है',
    welcomeDesc: 'WorkQuora पर एक कामगार (वर्कर) के रूप में पंजीकरण करके, आप इन नियमों का पालन करने के लिए सहमत हैं। आप स्वीकृत किए गए कार्यों को समय पर और पेशेवर ढंग से पूरा करने के लिए सहमत हैं।',
    payoutTitle: '2. कमाई और एस्क्रो',
    payoutDesc: 'नियोक्ता के पैसे सुरक्षित एस्क्रो में जमा होते हैं। काम सत्यापित होने के बाद, राशि आपके वॉलेट में भेज दी जाएगी। आप केवाईसी के बाद अपनी कमाई बैंक खाते में निकाल सकते हैं।',
    conductTitle: '3. कामगार आचरण संहिता',
    conductDesc: 'आपको नियोक्ताओं के साथ पेशेवर व्यवहार करना होगा। धोखाधड़ी, अलग से अतिरिक्त पैसों की मांग या खराब काम के कारण खाता तुरंत बंद किया जा सकता है।',
    agreeTick: 'मैं सभी नियमों और शर्तों से सहमत हूँ।',
    agreeBtn: 'सहमत हैं और आगे बढ़ें',
    permCameraTitle: 'कैमरा एक्सेस आवश्यक',
    permCameraDesc: 'WorkQuora को केवाईसी दस्तावेज और प्रोफाइल फोटो लेने के लिए कैमरा अनुमति की आवश्यकता है।',
    permNotifyTitle: 'नोटिफिकेशन एक्सेस आवश्यक',
    permNotifyDesc: 'WorkQuora को नए काम और नियोक्ताओं के संदेशों की सूचना देने के लिए नोटिफिकेशन अनुमति की आवश्यकता है।',
    btnAllow: 'अनुमति दें',
    btnDeny: 'अस्वीकार करें',
    readyTitle: 'खाता तैयार है',
    readyDesc: 'धन्यवाद! आपकी नियम सहमति और अनुमति सेटिंग्स पूरी हो चुकी हैं।',
  },
  bn: {
    title: 'শর্তাবলী এবং নিয়ম',
    welcomeTitle: '১. WorkQuora-এ আপনাকে স্বাগতম',
    welcomeDesc: 'WorkQuora-এ কর্মী হিসেবে নিবন্ধনের মাধ্যমে আপনি সমস্ত নিয়ম মেনে চলতে সম্মত হচ্ছেন। আপনি আপনার গৃহীত কাজগুলো সঠিকভাবে সম্পন্ন করতে প্রতিশ্রুতিবদ্ধ।',
    payoutTitle: '২. উপার্জন ও এসক্রো',
    payoutDesc: 'গ্রাহকদের অর্থ সুরক্ষিত এসক্রোতে জমা থাকে। কাজ যাচাইয়ের পর টাকা আপনার ওয়ালেটে পাঠানো হবে। কেওয়াইসি যাচাইয়ের পর আপনি আপনার উপার্জন ব্যাংকে তুলতে পারবেন।',
    conductTitle: '৩. কর্মীর আচরণবিধি',
    conductDesc: 'গ্রাহকদের সাথে পেশাদার আচরণ করতে হবে। জালিয়াতি বা অতিরিক্ত অর্থ দাবি করলে আপনার অ্যাকাউন্টটি বন্ধ করে দেওয়া হতে পারে।',
    agreeTick: 'আমি সমস্ত শর্তাবলী এবং নিয়মের সাথে একমত।',
    agreeBtn: 'সম্মত এবং এগিয়ে যান',
    permCameraTitle: 'ক্যামেরা অ্যাক্সেস প্রয়োজন',
    permCameraDesc: 'কেওয়াইসি নথিপত্র এবং প্রোফাইল ছবি তোলার জন্য WorkQuora-এর ক্যামেরার অনুমতি প্রয়োজন।',
    permNotifyTitle: 'নোটিফিকেশন অ্যাক্সেস প্রয়োজন',
    permNotifyDesc: 'নতুন কাজ এবং বার্তার নোটিফিকেশন পেতে WorkQuora-এর নোটিফিকেশনের অনুমতি প্রয়োজন।',
    btnAllow: 'অনুমতি দিন',
    btnDeny: 'প্রত্যাখ্যান করুন',
    readyTitle: 'অ্যাকাউন্ট প্রস্তুত',
    readyDesc: 'ধন্যবাদ! আপনার সম্মতি এবং অনুমতির সেটিংস সম্পন্ন হয়েছে।',
  },
  bho: {
    title: 'नियम आउर शर्त',
    welcomeTitle: '1. WorkQuora में रउआ सब के स्वागत बा',
    welcomeDesc: 'WorkQuora पर वर्कर के रूप में पंजीकरण करके रउआ सब नियम माने खातिर सहमत बानी। रउआ काम समय पर पूरा करे खातिर सहमत बानी।',
    payoutTitle: '2. कमाई आउर एस्क्रो',
    payoutDesc: 'हमनी के मालिक लोगन के पइसा सुरक्षित एस्क्रो में जमा रहेला। काम सत्यापित भइला के बाद पइसा रउआ वॉलेट में भेज दिहल जाई। केवाईसी के बाद रउआ पइसा निकाल सकत बानी।',
    conductTitle: '3. वर्कर आचरण',
    conductDesc: 'मालिक लोगन के साथे नीक व्यवहार करे के होई। धोखाधड़ी कइला पर खाता तुरंत बंद क दिहल जाई।',
    agreeTick: 'हम सब नियम आउर शर्त से सहमत बानी।',
    agreeBtn: 'सहमत बानी आउर आगे बढ़ीं',
    permCameraTitle: 'कैमरा एक्सेस चाहीं',
    permCameraDesc: 'WorkQuora के केवाईसी आउर प्रोफाइल फोटो खातिर कैमरा अनुमति के जरूरत बा।',
    permNotifyTitle: 'नोटिफिकेशन एक्सेस चाहीं',
    permNotifyDesc: 'WorkQuora के नया काम आउर संदेश के जानकारी खातिर नोटिफिकेशन अनुमति के जरूरत बा।',
    btnAllow: 'अनुमति दीं',
    btnDeny: 'अस्वीकार करीं',
    readyTitle: 'खाता तैयार बा',
    readyDesc: 'धन्यवाद! रउआ नियम सहमति आउर अनुमति सेटिंग पूरा क लिहलीं।',
  },
};

export default function TermsScreen({ route, navigation }: TermsScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = route.params || {};
  const [agreed, setAgreed] = useState(false);
  const { locale } = useLanguage();

  const currentLang = termsText[locale as keyof typeof termsText] || termsText.en;

  const requestPermissionsAndLogin = () => {
    if (Platform.OS === 'web') {
      const cam = window.confirm(`${currentLang.permCameraTitle}\n\n${currentLang.permCameraDesc}`);
      const notify = window.confirm(`${currentLang.permNotifyTitle}\n\n${currentLang.permNotifyDesc}`);
      completeRegistrationFlow(cam, notify);
    } else {
      Alert.alert(
        currentLang.permCameraTitle,
        currentLang.permCameraDesc,
        [
          {
            text: currentLang.btnDeny,
            onPress: () => requestNotificationAccess(false),
            style: 'cancel',
          },
          {
            text: currentLang.btnAllow,
            onPress: () => requestNotificationAccess(true),
          },
        ]
      );
    }
  };

  const requestNotificationAccess = (cameraAllowed: boolean) => {
    Alert.alert(
      currentLang.permNotifyTitle,
      currentLang.permNotifyDesc,
      [
        {
          text: currentLang.btnDeny,
          onPress: () => completeRegistrationFlow(cameraAllowed, false),
          style: 'cancel',
        },
        {
          text: currentLang.btnAllow,
          onPress: () => completeRegistrationFlow(cameraAllowed, true),
        },
      ]
    );
  };

  const completeRegistrationFlow = async (camera: boolean, notify: boolean) => {
    console.log(`Permissions status - Camera: ${camera}, Notifications: ${notify}`);
    if (Platform.OS !== 'web') {
      Alert.alert(currentLang.readyTitle, currentLang.readyDesc);
    }
    
    if (user && token) {
      await dispatch(loginUserSession({ user, token }));
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('MainApp');
      } else {
        navigation.navigate('MainApp');
      }
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#10b981" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentLang.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{currentLang.welcomeTitle}</Text>
          <Text style={styles.paragraph}>{currentLang.welcomeDesc}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{currentLang.payoutTitle}</Text>
          <Text style={styles.paragraph}>{currentLang.payoutDesc}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{currentLang.conductTitle}</Text>
          <Text style={styles.paragraph}>{currentLang.conductDesc}</Text>
        </View>
      </ScrollView>

      {/* Agree Tick Box & Footer button */}
      <View style={styles.agreeContainer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxSelected]}>
            {agreed && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>{currentLang.agreeTick}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !agreed && styles.btnDisabled]}
          disabled={!agreed}
          onPress={requestPermissionsAndLogin}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.btnText}>{currentLang.agreeBtn}</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf7ff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbc4d2',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#494551',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#cbc4d2',
    marginVertical: 20,
  },
  agreeContainer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#cbc4d2',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#10b981',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10b981',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1d1b20',
    fontWeight: '600',
    flex: 1,
  },
  btn: {
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#a7f3d0',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
