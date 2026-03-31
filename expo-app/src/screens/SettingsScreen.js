import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  Text, 
  Button, 
  IconButton,
  Surface,
  TextInput,
  Switch,
  Divider
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import storageService from '../utils/storage';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState({
    age: '',
    gender: '',
    skinType: '',
    familyHistory: false,
    sunExposure: '',
    previousSkinCancer: false,
    moleCount: '',
    freckles: false,
    eyeColor: '',
    hairColor: '',
    ethnicity: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await storageService.getUserPreferences();
      if (savedProfile.userProfile) {
        setUserProfile(savedProfile.userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const saveUserProfile = async () => {
    try {
      await storageService.saveUserPreferences({ userProfile });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving user profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const calculateRiskScore = () => {
    let riskScore = 0;
    let riskFactors = [];

    // Age factor
    const age = parseInt(userProfile.age);
    if (age >= 50) {
      riskScore += 2;
      riskFactors.push('Age 50+');
    } else if (age >= 30) {
      riskScore += 1;
      riskFactors.push('Age 30-49');
    }

    // Gender factor
    if (userProfile.gender === 'Male') {
      riskScore += 1;
      riskFactors.push('Male gender');
    }

    // Skin type factor
    if (userProfile.skinType === 'Type I' || userProfile.skinType === 'Type II') {
      riskScore += 2;
      riskFactors.push('Fair skin type');
    } else if (userProfile.skinType === 'Type III') {
      riskScore += 1;
      riskFactors.push('Light skin type');
    }

    // Family history
    if (userProfile.familyHistory) {
      riskScore += 2;
      riskFactors.push('Family history');
    }

    // Sun exposure
    if (userProfile.sunExposure === 'High') {
      riskScore += 2;
      riskFactors.push('High sun exposure');
    } else if (userProfile.sunExposure === 'Moderate') {
      riskScore += 1;
      riskFactors.push('Moderate sun exposure');
    }

    // Previous skin cancer
    if (userProfile.previousSkinCancer) {
      riskScore += 3;
      riskFactors.push('Previous skin cancer');
    }

    // Mole count
    const moleCount = parseInt(userProfile.moleCount);
    if (moleCount >= 50) {
      riskScore += 2;
      riskFactors.push('50+ moles');
    } else if (moleCount >= 20) {
      riskScore += 1;
      riskFactors.push('20-49 moles');
    }

    // Freckles
    if (userProfile.freckles) {
      riskScore += 1;
      riskFactors.push('Freckles');
    }

    return { riskScore, riskFactors };
  };

  const getRiskLevel = (score) => {
    if (score >= 8) return { level: 'High', color: '#EF4444' };
    if (score >= 5) return { level: 'Medium', color: '#F59E0B' };
    return { level: 'Low', color: '#10B981' };
  };

  const riskData = calculateRiskScore();
  const riskLevel = getRiskLevel(riskData.riskScore);

  const renderProfileField = (label, value, key, type = 'text', options = []) => {
    if (isEditing) {
      if (type === 'select') {
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.selectContainer}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOption,
                    value === option && styles.selectedOption
                  ]}
                  onPress={() => setUserProfile({ ...userProfile, [key]: option })}
                >
                  <Text style={[
                    styles.selectOptionText,
                    value === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      } else if (type === 'switch') {
        return (
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <Switch
              value={value}
              onValueChange={(newValue) => setUserProfile({ ...userProfile, [key]: newValue })}
              color="#00D4AA"
            />
          </View>
        );
      } else {
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
              value={value}
              onChangeText={(text) => setUserProfile({ ...userProfile, [key]: text })}
              placeholder={`Enter ${label.toLowerCase()}`}
              style={styles.textInput}
              mode="outlined"
              keyboardType={type === 'number' ? 'numeric' : 'default'}
            />
          </View>
        );
      }
    } else {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#FFFFFF"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>User profile & preferences</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Risk Assessment Card */}
        <Card style={styles.riskCard}>
          <Card.Content>
            <View style={styles.riskHeader}>
              <IconButton
                icon="shield-alert"
                size={32}
                iconColor={riskLevel.color}
              />
              <View style={styles.riskInfo}>
                <Text style={styles.riskTitle}>Skin Cancer Risk Assessment</Text>
                <Text style={[styles.riskLevel, { color: riskLevel.color }]}>
                  {riskLevel.level} Risk
                </Text>
                <Text style={styles.riskScore}>Score: {riskData.riskScore}/15</Text>
              </View>
            </View>
            
            {riskData.riskFactors.length > 0 && (
              <View style={styles.riskFactors}>
                <Text style={styles.riskFactorsTitle}>Risk Factors:</Text>
                <View style={styles.riskFactorsList}>
                  {riskData.riskFactors.map((factor, index) => (
                    <View key={index} style={styles.riskFactorItem}>
                      <Text style={styles.riskFactorText}>• {factor}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>User Profile</Text>
              <Button
                mode={isEditing ? "contained" : "outlined"}
                onPress={() => isEditing ? saveUserProfile() : setIsEditing(true)}
                style={isEditing ? styles.saveButton : styles.editButton}
                labelStyle={isEditing ? styles.saveButtonLabel : styles.editButtonLabel}
                icon={isEditing ? "check" : "pencil"}
              >
                {isEditing ? "Save" : "Edit"}
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* Basic Information */}
            <Text style={styles.subsectionTitle}>Basic Information</Text>
            {renderProfileField("Age", userProfile.age, "age", "number")}
            {renderProfileField("Gender", userProfile.gender, "gender", "select", ["Male", "Female", "Other"])}
            {renderProfileField("Ethnicity", userProfile.ethnicity, "ethnicity", "select", ["Caucasian", "Hispanic", "African American", "Asian", "Other"])}

            <Divider style={styles.divider} />

            {/* Physical Characteristics */}
            <Text style={styles.subsectionTitle}>Physical Characteristics</Text>
            {renderProfileField("Skin Type", userProfile.skinType, "skinType", "select", ["Type I (Very Fair)", "Type II (Fair)", "Type III (Light)", "Type IV (Medium)", "Type V (Dark)", "Type VI (Very Dark)"])}
            {renderProfileField("Eye Color", userProfile.eyeColor, "eyeColor", "select", ["Blue", "Green", "Hazel", "Brown", "Other"])}
            {renderProfileField("Hair Color", userProfile.hairColor, "hairColor", "select", ["Blonde", "Red", "Brown", "Black", "Gray", "Other"])}
            {renderProfileField("Number of Moles", userProfile.moleCount, "moleCount", "number")}
            {renderProfileField("Freckles", userProfile.freckles, "freckles", "switch")}

            <Divider style={styles.divider} />

            {/* Risk Factors */}
            <Text style={styles.subsectionTitle}>Risk Factors</Text>
            {renderProfileField("Family History of Skin Cancer", userProfile.familyHistory, "familyHistory", "switch")}
            {renderProfileField("Previous Skin Cancer", userProfile.previousSkinCancer, "previousSkinCancer", "switch")}
            {renderProfileField("Sun Exposure Level", userProfile.sunExposure, "sunExposure", "select", ["Low", "Moderate", "High"])}

            {isEditing && (
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonLabel}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={saveUserProfile}
                  style={styles.saveButton}
                  labelStyle={styles.saveButtonLabel}
                >
                  Save Profile
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About Risk Assessment</Text>
            <Text style={styles.infoText}>
              This risk assessment is based on established medical research and should not replace professional medical advice. 
              Higher risk scores indicate increased likelihood of developing skin cancer, but individual risk varies.
            </Text>
            <Text style={styles.infoText}>
              Regular skin self-examinations and annual dermatologist visits are recommended for all individuals, 
              especially those with higher risk scores.
            </Text>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Keep your profile updated for accurate risk assessment
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    backgroundColor: '#1A1A2E',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  headerSpacer: {
    width: 48,
  },
  riskCard: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  riskFactors: {
    marginTop: 16,
  },
  riskFactorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  riskFactorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  riskFactorItem: {
    width: '50%',
    marginBottom: 4,
  },
  riskFactorText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  profileCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    borderColor: '#00D4AA',
    borderWidth: 2,
  },
  editButtonLabel: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00D4AA',
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: '#374151',
    marginVertical: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
    marginBottom: 16,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#16213E',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#16213E',
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedOption: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#6B7280',
    borderWidth: 2,
  },
  cancelButtonLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default SettingsScreen;

