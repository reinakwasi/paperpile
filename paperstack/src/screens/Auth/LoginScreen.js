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
  Button,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { authService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      const response = await authService.login(email, password);
      
      // Get existing user data if any
      const existingUserData = await AsyncStorage.getItem('user');
      const existingUser = existingUserData ? JSON.parse(existingUserData) : {};
      
      // Create user data object, preserving any existing profile data
      const userData = {
        ...existingUser,
        email: email,
        name: existingUser.name || email.split('@')[0], // Use existing name or default
        avatar: existingUser.avatar || null, // Preserve existing avatar
        updatedAt: existingUser.updatedAt || new Date().toISOString()
      };
      
      // Store the token and user data
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      Alert.alert('Success', 'Login successful!', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data || 'Login failed. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../../assets/feather.png')} style={styles.logo} />
        <TouchableOpacity>
          <Text style={styles.help}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Image */}
      <View style={styles.imageContainer}>
        <Image source={require('../../../assets/phone.png')} style={styles.phoneImage} />
      </View>

      {/* Welcome Text */}
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Login to continue and explore your dashboard</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="email" size={20} color="#9CA3AF" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <MaterialIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={togglePasswordVisibility}>
          <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.or}>OR</Text>
        <View style={styles.divider} />
      </View>

      {/* Google Button */}
      <TouchableOpacity style={styles.socialButton}>
        <MaterialCommunityIcons name="google" size={20} color="black" style={{ marginRight: 10 }} />
        <Text style={styles.socialText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Apple Button */}
      <TouchableOpacity style={styles.socialButton}>
        <MaterialCommunityIcons name="apple" size={20} color="black" style={{ marginRight: 10 }} />
        <Text style={styles.socialText}>Continue with Apple</Text>
      </TouchableOpacity>

      {/* Sign Up */}
      <Button 
        title="Don't have an account? Sign Up" 
        onPress={() => navigation.navigate('SignUp')} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  help: {
    color: '#6B7280',
    fontSize: 14,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  phoneImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#fff',
    width: '100%',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#111827',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },
  forgotText: {
    color: '#6366F1',
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  or: {
    marginHorizontal: 8,
    color: '#9CA3AF',
    fontSize: 12,
  },
  socialButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  socialText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 20,
  },
  signupLink: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});
