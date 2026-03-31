import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Surface,
  Text,
  IconButton,
  FAB,
  Avatar
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const handleCameraPress = () => {
    navigation.navigate('Camera');
  };

  const handleHistoryPress = () => {
    navigation.navigate('History');
  };

  const handleEducationPress = () => {
    navigation.navigate('Education');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleEmergencyInfo = () => {
    Alert.alert(
      'Important Medical Disclaimer',
      'This app is for educational purposes only and should not replace professional medical advice. If you notice any concerning skin changes, please consult a dermatologist immediately.',
      [{ text: 'I Understand', style: 'default' }]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>DERMACHECK</Text>
            </View>
            <Text style={styles.tagline}>Bringing AI to healthcare</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Main Assessment Card */}
        <Card style={styles.assessmentCard}>
          <Card.Content>
            <View style={styles.assessmentHeader}>
              <View style={styles.assessmentIcon}>
                <Text style={styles.assessmentIconText}>📸</Text>
              </View>
              <View style={styles.assessmentInfo}>
                <Text style={styles.assessmentTitle}>Start assessing lesions</Text>
                <Text style={styles.assessmentSubtitle}>Monitor your moles with one shot</Text>
              </View>
            </View>
            
            {/* Progress Steps */}
            <View style={styles.progressContainer}>
              <View style={styles.progressStep}>
                <View style={styles.progressStepIcon}>
                  <Text style={styles.progressStepNumber}>1</Text>
                </View>
                <Text style={styles.progressStepText}>Image</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={styles.progressStepIcon}>
                  <Text style={styles.progressStepNumber}>2</Text>
                </View>
                <Text style={styles.progressStepText}>Analysis</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={styles.progressStepIcon}>
                  <Text style={styles.progressStepNumber}>3</Text>
                </View>
                <Text style={styles.progressStepText}>Referral</Text>
              </View>
            </View>

            {/* Action Button */}
            <Button 
              mode="contained" 
              onPress={handleCameraPress}
              style={styles.assessmentButton}
              contentStyle={styles.assessmentButtonContent}
              icon="camera"
              labelStyle={styles.assessmentButtonLabel}
            >
              Get Started
            </Button>
          </Card.Content>
        </Card>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={() => navigation.navigate('DermatologistMode')}
            activeOpacity={0.7}
          >
            <IconButton
              icon="account-switch"
              size={32}
              iconColor="#00D4AA"
              onPress={() => navigation.navigate('DermatologistMode')}
            />
            <Text style={styles.quickActionTitle}>Change Mode</Text>
            <Text style={styles.quickActionSubtitle}>Switch to doctor view</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={handleHistoryPress}
            activeOpacity={0.7}
          >
            <IconButton
              icon="history"
              size={32}
              iconColor="#00D4AA"
              onPress={handleHistoryPress}
            />
            <Text style={styles.quickActionTitle}>History</Text>
            <Text style={styles.quickActionSubtitle}>View past analyses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={handleEducationPress}
            activeOpacity={0.7}
          >
            <IconButton
              icon="book-open-variant"
              size={32}
              iconColor="#00D4AA"
              onPress={handleEducationPress}
            />
            <Text style={styles.quickActionTitle}>Learn</Text>
            <Text style={styles.quickActionSubtitle}>Educational content</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <IconButton
              icon="settings"
              size={32}
              iconColor="#00D4AA"
              onPress={handleSettingsPress}
            />
            <Text style={styles.quickActionTitle}>Settings</Text>
            <Text style={styles.quickActionSubtitle}>User profile & preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Analysis */}
        <View style={styles.recentAnalysis}>
          <Text style={styles.sectionTitle}>Recent Analysis</Text>
          <Card style={styles.analysisCard}>
            <Card.Content>
              <View style={styles.analysisItem}>
                <View style={styles.analysisImageContainer}>
                  <View style={styles.analysisImage}>
                    <Text style={styles.analysisImageText}>📷</Text>
                  </View>
                  <View style={styles.analysisStatus}>
                    <Text style={styles.analysisStatusText}>✓</Text>
                  </View>
                </View>
                <View style={styles.analysisInfo}>
                  <Text style={styles.analysisTitle}>Image ID: 0YS772</Text>
                  <Text style={styles.analysisSubtitle}>2 days ago</Text>
                  <View style={styles.analysisResult}>
                    <Text style={styles.analysisResultText}>No evidence detected</Text>
                  </View>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  iconColor="#9CA3AF"
                  onPress={handleHistoryPress}
                />
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by advanced Artificial Intelligence</Text>
          <Text style={styles.disclaimerText}>USE ONLY FOR CLINICAL INVESTIGATION</Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F23', // Very dark blue
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F23', // Very dark blue
  },
  header: {
    backgroundColor: '#1A1A2E', // Dark navy
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    marginBottom: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D4AA', // Teal
    letterSpacing: 2,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 16,
    color: '#E5E7EB', // Light gray
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  assessmentCard: {
    marginBottom: 30,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#1A1A2E', // Dark navy
    borderWidth: 2,
    borderColor: '#FFFFFF', // White outline
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  assessmentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D4AA', // Teal
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  assessmentIconText: {
    fontSize: 28,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assessmentSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D4AA', // Teal
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressLine: {
    height: 2,
    width: 20,
    backgroundColor: '#374151',
    marginHorizontal: 8,
  },
  progressStepText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  assessmentButton: {
    backgroundColor: '#00D4AA', // Teal
    borderRadius: 12,
    elevation: 4,
  },
  assessmentButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  assessmentButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickActionCard: {
    width: '48%',
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1A1A2E', // Dark navy
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  recentAnalysis: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  analysisCard: {
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#1A1A2E', // Dark navy
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  analysisImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisImageText: {
    fontSize: 24,
  },
  analysisStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981', // Green
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  analysisInfo: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  analysisResult: {
    backgroundColor: '#10B981', // Green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  analysisResultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default HomeScreen;
