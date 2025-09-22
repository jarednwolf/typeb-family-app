import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CoppaService } from '../../services/coppa/CoppaService';

interface ParentalConsent {
  parentEmail: string;
  consentGiven: boolean;
  consentDate: Date;
  verificationMethod: 'email' | 'credit_card' | 'id_upload';
  childInfo: {
    firstName: string;
    birthDate: Date;
  };
}

type AuthStackParamList = {
  ParentalConsent: { 
    childData: {
      birthDate: Date;
      isUnder13: boolean;
      requiresParentalConsent: boolean;
    }
  };
  Login: undefined;
  Registration: undefined;
};

type ParentalConsentScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ParentalConsent'>;
type ParentalConsentScreenRouteProp = RouteProp<AuthStackParamList, 'ParentalConsent'>;

export const ParentalConsentScreen: React.FC = () => {
  const navigation = useNavigation<ParentalConsentScreenNavigationProp>();
  const route = useRoute<ParentalConsentScreenRouteProp>();
  const { childData } = route.params;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    childFirstName: '',
    parentEmail: '',
    parentPhone: '',
    verificationMethod: 'email' as 'email' | 'credit_card' | 'id_upload',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const sendConsentEmail = async () => {
    if (!validateEmail(formData.parentEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!formData.childFirstName.trim()) {
      Alert.alert('Required Field', 'Please enter your child\'s first name.');
      return;
    }

    setLoading(true);
    try {
      const consentId = await CoppaService.requestParentalConsent(
        {
          firstName: formData.childFirstName,
          birthDate: childData.birthDate,
        },
        formData.parentEmail
      );

      Alert.alert(
        'Email Sent',
        `We've sent a consent form to ${formData.parentEmail}. Please check your email and follow the instructions to complete the consent process.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send consent email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Icon name="person" size={40} color="#4CAF50" />
        <Text style={styles.stepTitle}>Child Information</Text>
        <Text style={styles.stepSubtitle}>
          Tell us about your child
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Child's First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter first name only"
          value={formData.childFirstName}
          onChangeText={(text) => handleInputChange('childFirstName', text)}
        />
        <Text style={styles.helperText}>
          We only collect your child's first name for privacy protection
        </Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          if (formData.childFirstName.trim()) {
            setStep(2);
          } else {
            Alert.alert('Required', 'Please enter your child\'s first name');
          }
        }}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Icon name="email" size={40} color="#4CAF50" />
        <Text style={styles.stepTitle}>Parent Contact Information</Text>
        <Text style={styles.stepSubtitle}>
          We'll send you a consent form to review
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Parent/Guardian Email</Text>
        <TextInput
          style={styles.input}
          placeholder="parent@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.parentEmail}
          onChangeText={(text) => handleInputChange('parentEmail', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
          value={formData.parentPhone}
          onChangeText={(text) => handleInputChange('parentPhone', text)}
        />
        <Text style={styles.helperText}>
          Providing a phone number helps us verify your identity faster
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setStep(3)}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Icon name="verified-user" size={40} color="#4CAF50" />
        <Text style={styles.stepTitle}>Verification Method</Text>
        <Text style={styles.stepSubtitle}>
          Choose how you'd like to verify your identity
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.verificationOption,
          formData.verificationMethod === 'email' && styles.selectedOption,
        ]}
        onPress={() => handleInputChange('verificationMethod', 'email')}
      >
        <Icon name="email" size={24} color="#666" />
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Email Verification</Text>
          <Text style={styles.optionDescription}>
            We'll send a secure link to your email
          </Text>
        </View>
        {formData.verificationMethod === 'email' && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.verificationOption,
          formData.verificationMethod === 'credit_card' && styles.selectedOption,
        ]}
        onPress={() => handleInputChange('verificationMethod', 'credit_card')}
      >
        <Icon name="credit-card" size={24} color="#666" />
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Credit Card Verification</Text>
          <Text style={styles.optionDescription}>
            Verify with a $0.50 charge (fully refunded)
          </Text>
        </View>
        {formData.verificationMethod === 'credit_card' && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={sendConsentEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Send Consent Form</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, step >= 1 && styles.activeStep]} />
          <View style={[styles.progressStep, step >= 2 && styles.activeStep]} />
          <View style={[styles.progressStep, step >= 3 && styles.activeStep]} />
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.infoBox}>
          <Icon name="info" size={20} color="#1976D2" />
          <Text style={styles.infoText}>
            TypeB complies with COPPA (Children's Online Privacy Protection Act). 
            We require parental consent for users under 13 to protect their privacy and ensure a safe experience.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              'Cancel Registration',
              'Are you sure you want to cancel? Your child won\'t be able to use TypeB without parental consent.',
              [
                { text: 'Continue Setup', style: 'cancel' },
                { 
                  text: 'Cancel', 
                  style: 'destructive',
                  onPress: () => navigation.navigate('Login'),
                },
              ]
            );
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressStep: {
    width: 80,
    height: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: '#4CAF50',
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  verificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  selectedOption: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  optionContent: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 10,
    lineHeight: 20,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});