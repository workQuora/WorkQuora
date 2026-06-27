import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

export const useKycGate = () => {
  const navigation = useNavigation<any>();
  const user = useSelector((state: any) => state.auth.user);

  const requireKycOrToast = useCallback((actionFn: () => void, message: string = 'Complete KYC to perform this action') => {
    // If user is verified, simply proceed with the action
    if (user?.kycVerified) {
      actionFn();
      return;
    }

    // Otherwise, show a toast with a Deep Link/Action to Verification
    Toast.show({
      type: 'error',
      text1: 'Verification Required',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      onPress: () => {
        Toast.hide();
        // The screen name might differ between Client/Worker app, but typically it's 'Settings' -> 'KYC' or 'KycScreen'
        // For standard navigation, redirecting to the settings tab or KYC screen explicitly
        // If "KycScreen" is globally accessible in AppNavigator:
        navigation.navigate('Settings'); // Redirect to settings to initiate KYC
      }
    });
  }, [user, navigation]);

  return requireKycOrToast;
};
