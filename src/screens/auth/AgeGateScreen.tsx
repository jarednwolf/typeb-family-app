import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
const DateTimePicker: any = require('@react-native-community/datetimepicker').default || require('@react-native-community/datetimepicker');
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AgeGateData {
  birthDate: Date;
  isUnder13: boolean;
  requiresParentalConsent: boolean;
}

type AuthStackParamList = {
  AgeGate: undefined;
  ParentalConsent: { childData: AgeGateData };
  Registration: { ageVerified: boolean };
  Login: undefined;
};

type AgeGateScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AgeGate'>;

export const AgeGateScreen: React.FC = () => {
  const navigation = useNavigation<AgeGateScreenNavigationProp>();
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleAgeSubmit = async () => {
    const age = calculateAge(birthDate);
    
    const ageGateData: AgeGateData = {
      birthDate,
      isUnder13: age < 13,
      requiresParentalConsent: age < 13,
    };

    if (age < 13) {
      // Redirect to parental consent flow
      Alert.alert(
        'Parental Consent Required',
        'Users under 13 require parental consent to use TypeB. We\'ll need to contact your parent or guardian.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('ParentalConsent', { childData: ageGateData }),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } else {
      // Continue normal registration
      navigation.navigate('Registration', { ageVerified: true });
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Icon name="cake" size={60} color="#4CAF50" />
          <Text style={styles.title}>Verify Your Age</Text>
          <Text style={styles.subtitle}>
            To comply with children's privacy laws, we need to verify your age before you can create an account.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>When were you born?</Text>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={24} color="#666" />
            <Text style={styles.dateText}>{formatDate(birthDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event: any, selectedDate?: Date) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setBirthDate(selectedDate);
                }
              }}
            />
          )}

          <View style={styles.notice}>
            <Icon name="info" size={20} color="#1976D2" />
            <Text style={styles.noticeText}>
              We collect age information to comply with COPPA (Children's Online Privacy Protection Act). 
              This information is used only for age verification and parental consent purposes.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleAgeSubmit}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 10,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
});