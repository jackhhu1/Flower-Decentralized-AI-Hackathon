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
  ProgressBar,
  Surface
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import storageService from '../utils/storage';

const { width } = Dimensions.get('window');

const ResultsScreen = ({ navigation, route }) => {
  const { imageUri, results } = route.params || {};
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    // Generate dummy analysis data with gamified statistics
    generateDummyAnalysis();
  }, []);

  const generateDummyAnalysis = () => {
    const dummyData = {
      imageId: `IMG_${Date.now()}`,
      analysisTime: new Date().toISOString(),
      overallRisk: 'Medium',
      confidence: 87,
      predictions: [
        { className: 'Melanocytic nevi', probability: 0.45, confidence: 45, color: '#10B981' },
        { className: 'Melanoma', probability: 0.25, confidence: 25, color: '#EF4444' },
        { className: 'Basal cell carcinoma', probability: 0.15, confidence: 15, color: '#F59E0B' },
        { className: 'Benign keratosis', probability: 0.10, confidence: 10, color: '#3B82F6' },
        { className: 'Actinic keratoses', probability: 0.03, confidence: 3, color: '#8B5CF6' },
        { className: 'Vascular lesions', probability: 0.02, confidence: 2, color: '#06B6D4' },
        { className: 'Dermatofibroma', probability: 0.00, confidence: 0, color: '#6B7280' }
      ],
      riskLevel: 'Medium',
      riskScore: 65,
      recommendations: [
        'Monitor the lesion for any changes in size, shape, or color',
        'Take another photo in 2-3 months for comparison',
        'Consider professional evaluation if changes are noticed'
      ],
      nextSteps: [
        'Schedule follow-up in 3 months',
        'Document any changes in the app',
        'Contact dermatologist if concerned'
      ]
    };
    setAnalysisData(dummyData);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return 'alert-circle';
      case 'Medium': return 'clock-alert';
      case 'Low': return 'check-circle';
      default: return 'help-circle';
    }
  };

  const handleForwardToDermatologist = () => {
    Alert.alert(
      'Forward to Dermatologist',
      'This will send your analysis results to a dermatologist for professional review. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Forward', 
          style: 'default',
          onPress: () => {
            Alert.alert('Success', 'Analysis forwarded to dermatologist. You will receive a response within 24-48 hours.');
          }
        }
      ]
    );
  };

  const handleSaveAnalysis = async () => {
    try {
      if (!analysisData) {
        Alert.alert('Error', 'No analysis data to save.');
        return;
      }

      // Prepare analysis data for storage
      const analysisToSave = {
        imageUri: imageUri,
        imageId: analysisData.imageId,
        analysisTime: analysisData.analysisTime,
        riskLevel: analysisData.riskLevel,
        riskScore: analysisData.riskScore,
        confidence: analysisData.confidence,
        predictions: analysisData.predictions,
        recommendations: analysisData.recommendations,
        topPrediction: analysisData.predictions[0], // First prediction is the top one
        modelVersion: 'AI v2.1',
        saved: true
      };

      // Save to storage
      await storageService.saveAnalysisResult(analysisToSave);
      
      Alert.alert('Success', 'Analysis saved to your history.');
    } catch (error) {
      console.error('Error saving analysis:', error);
      Alert.alert('Error', 'Failed to save analysis. Please try again.');
    }
  };

  if (!analysisData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

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
              <Text style={styles.headerTitle}>Analysis Complete</Text>
              <Text style={styles.headerSubtitle}>Image ID: {analysisData.imageId}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Risk Assessment Card */}
        <Card style={styles.riskCard}>
          <Card.Content>
            <View style={styles.riskHeader}>
              <View style={styles.riskIconContainer}>
                <IconButton
                  icon={getRiskIcon(analysisData.riskLevel)}
                  size={32}
                  iconColor={getRiskColor(analysisData.riskLevel)}
                />
              </View>
              <View style={styles.riskInfo}>
                <Text style={styles.riskTitle}>Risk Assessment</Text>
                <Text style={[styles.riskLevel, { color: getRiskColor(analysisData.riskLevel) }]}>
                  {analysisData.riskLevel} Risk
                </Text>
                <Text style={styles.riskScore}>Confidence: {analysisData.confidence}%</Text>
              </View>
            </View>
            
            {/* Risk Score Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Risk Score: {analysisData.riskScore}/100</Text>
              <ProgressBar 
                progress={analysisData.riskScore / 100} 
                color={getRiskColor(analysisData.riskLevel)}
                style={styles.progressBar}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Cancer Classification Breakdown */}
        <Card style={styles.breakdownCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Cancer Classification Breakdown</Text>
            <Text style={styles.sectionSubtitle}>AI Analysis Results</Text>
            
            {analysisData.predictions.map((prediction, index) => (
              <View key={index} style={styles.predictionItem}>
                <View style={styles.predictionInfo}>
                  <View style={[styles.predictionColor, { backgroundColor: prediction.color }]} />
                  <Text style={styles.predictionName}>{prediction.className}</Text>
                </View>
                <View style={styles.predictionStats}>
                  <Text style={styles.predictionConfidence}>{prediction.confidence}%</Text>
                  <View style={styles.predictionBar}>
                    <View 
                      style={[
                        styles.predictionBarFill, 
                        { 
                          width: `${prediction.confidence}%`,
                          backgroundColor: prediction.color
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Gamified Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Analysis Statistics</Text>
            
            <View style={styles.statsGrid}>
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>87%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </Surface>
              
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>2.3s</Text>
                <Text style={styles.statLabel}>Analysis Time</Text>
              </Surface>
              
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>Classes Analyzed</Text>
              </Surface>
              
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>AI v2.1</Text>
                <Text style={styles.statLabel}>Model Version</Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        {/* Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analysisData.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationBullet} />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleSaveAnalysis}
                style={styles.saveButton}
                labelStyle={styles.saveButtonLabel}
                icon="bookmark"
              >
                Save Analysis
              </Button>
              
              <Button
                mode="contained"
                onPress={handleForwardToDermatologist}
                style={styles.forwardButton}
                labelStyle={styles.forwardButtonLabel}
                icon="send"
              >
                Forward
              </Button>
            </View>

            {/* Done Button */}
            <View style={styles.doneButtonContainer}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Home')}
                style={styles.doneButton}
                labelStyle={styles.doneButtonLabel}
                icon="home"
              >
                Done
              </Button>
            </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This analysis is for educational purposes only and should not replace professional medical advice.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
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
    marginBottom: 20,
  },
  riskIconContainer: {
    marginRight: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  breakdownCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  predictionColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  predictionName: {
    fontSize: 14,
    color: '#E5E7EB',
    flex: 1,
  },
  predictionStats: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  predictionConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  predictionBar: {
    width: 60,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  predictionBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statsCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#16213E',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  recommendationsCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D4AA',
    marginTop: 8,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#E5E7EB',
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    marginTop: 10,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    borderColor: '#00D4AA',
    borderWidth: 2,
  },
  saveButtonLabel: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  forwardButton: {
    flex: 1,
    backgroundColor: '#00D4AA',
  },
      forwardButtonLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
      },
      doneButtonContainer: {
        margin: 20,
        marginTop: 10,
      },
      doneButton: {
        backgroundColor: '#374151',
        borderRadius: 12,
        paddingVertical: 16,
      },
      doneButtonLabel: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
      },
      footer: {
        padding: 20,
        paddingBottom: 40,
      },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ResultsScreen;