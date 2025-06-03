import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../../services/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password.');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authService.signup(email, password);
      console.log('Signup successful, navigating to Verification');
      navigation.navigate('Verification', { email, password });
    } catch (error) {
      console.log('Signup Error:', error);
      const errorMessage = error.response?.data || 
                          error.message || 
                          'Failed to create account. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google sign up
    Alert.alert('Coming Soon', 'Google sign up will be available soon!');
  };

  const handleMicrosoftSignUp = () => {
    // TODO: Implement Microsoft sign up
    Alert.alert('Coming Soon', 'Microsoft sign up will be available soon!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image source={require('../../../assets/stack.png')} style={styles.logo} />

      {/* Heading */}
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>
        Start organizing your papers in seconds.
      </Text>

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="you@email.com"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          style={[styles.input, styles.passwordInput]}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialCommunityIcons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showConfirmPassword}
          style={[styles.input, styles.passwordInput]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <MaterialCommunityIcons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={24}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.signupText}>Sign up</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.or}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* Google Signup */}
      <TouchableOpacity style={styles.oauthButton} onPress={handleGoogleSignUp}>
        <MaterialCommunityIcons
          name="google"
          size={20}
          color="#EA4335"
          style={styles.oauthIcon}
        />
        <Text style={styles.oauthText}>Sign up with Google</Text>
      </TouchableOpacity>

      {/* Microsoft Signup */}
      <TouchableOpacity style={styles.oauthButton} onPress={handleMicrosoftSignUp}>
        <MaterialCommunityIcons
          name="microsoft"
          size={20}
          color="#0078D4"
          style={styles.oauthIcon}
        />
        <Text style={styles.oauthText}>Sign up with Microsoft</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          Log in
        </Text>
      </Text>

      {/* Copyright */}
      <Text style={styles.copyright}>
        © 2024 PaperStack. All rights reserved.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    transform: [{ scale: 2 }],
    marginBottom: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  signupButton: {
    backgroundColor: '#4F46E5',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  or: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    position: 'relative',
  },
  oauthIcon: {
    position: 'absolute',
    left: 16,
  },
  oauthText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
  },
  loginLink: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 14,
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
  },
});