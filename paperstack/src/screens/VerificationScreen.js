import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VerificationScreen = ({ route, navigation }) => {
  const { email, password } = route.params;
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    try {
      const response = await authService.verifyOtp(email, otp, password);
      
      // Store user data
      const userData = {
        email: email,
        name: email.split('@')[0], // Use part of email as default name
        avatar: null
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Store token if provided
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.replace('MainTabs') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data || 'Failed to verify code');
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;
    
    setIsResending(true);
    try {
      await authService.signup(email, password);
      setTimeLeft(300);
      Alert.alert('Success', 'New verification code sent!');
    } catch (error) {
      Alert.alert('Error', error.response?.data || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        Enter the verification code sent to {email}
      </Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          Time remaining: {formatTime(timeLeft)}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter verification code"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleVerify}
      >
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, timeLeft > 0 && styles.resendButtonDisabled]}
        onPress={handleResendCode}
        disabled={timeLeft > 0 || isResending}
      >
        <Text style={styles.resendButtonText}>
          {isResending ? 'Sending...' : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 18,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default VerificationScreen; 