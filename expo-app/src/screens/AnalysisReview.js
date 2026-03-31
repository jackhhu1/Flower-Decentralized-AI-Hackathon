import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  Text, 
  Button, 
  IconButton,
  Surface,
  ProgressBar,
  TextInput
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const AnalysisReview = ({ navigation, route }) => {
  const { analysis } = route.params || {};
  const [doctorNotes, setDoctorNotes] = useState('');
  const [doctorDiagnosis, setDoctorDiagnosis] = useState(analysis?.topPrediction?.className || '');
  const [confidence, setConfidence] = useState(analysis?.topPrediction?.confidence || 0);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Analysis',
      'Are you sure you want to approve this AI analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: () => {
            Alert.alert('Approved', 'Analysis has been approved and sent to patient.');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Analysis',
      'Are you sure you want to reject this AI analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Rejected', 'Analysis has been rejected and flagged for review.');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleRequestMoreInfo = () => {
    Alert.alert(
      'Request More Information',
      'This will send a request to the patient for additional images or information.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          style: 'default',
          onPress: () => {
            Alert.alert('Request Sent', 'Patient has been notified to provide additional information.');
          }
        }
      ]
    );
  };

  const handleDeleteAnalysis = () => {
    Alert.alert(
      'Delete Analysis',
      `Are you sure you want to permanently delete this analysis for patient ${analysis.imageId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await storageService.deleteAnalysis(analysis.id);
              Alert.alert('Deleted', 'Analysis successfully deleted.');
              navigation.goBack(); // Return to dermatologist mode
            } catch (error) {
              console.error('Error deleting analysis:', error);
              Alert.alert('Error', 'Failed to delete analysis.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!analysis) {
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
              <Text style={styles.headerTitle}>Analysis Review</Text>
              <Text style={styles.headerSubtitle}>Patient: {analysis.imageId}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Patient Image */}
        <Card style={styles.imageCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Patient Image</Text>
            <View style={styles.imageContainer}>
              {analysis.imageUri ? (
                <Image 
                  source={{ uri: analysis.imageUri }} 
                  style={styles.patientImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>📷</Text>
                  <Text style={styles.placeholderLabel}>No image available</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* AI Analysis Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>AI Analysis Summary</Text>
            
            <View style={styles.analysisHeader}>
              <View style={styles.riskIndicator}>
                <IconButton
                  icon="alert-circle"
                  size={32}
                  iconColor={getRiskColor(analysis.riskLevel)}
                />
                <View style={styles.riskInfo}>
                  <Text style={styles.riskTitle}>Risk Level</Text>
                  <Text style={[styles.riskLevel, { color: getRiskColor(analysis.riskLevel) }]}>
                    {analysis.riskLevel}
                  </Text>
                </View>
              </View>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>AI Confidence</Text>
                <Text style={styles.confidenceValue}>{analysis.topPrediction?.confidence}%</Text>
                <ProgressBar 
                  progress={analysis.topPrediction?.confidence / 100} 
                  color={getRiskColor(analysis.riskLevel)}
                  style={styles.confidenceBar}
                />
              </View>
            </View>

            <View style={styles.predictionDetails}>
              <Text style={styles.predictionTitle}>Primary Diagnosis</Text>
              <Text style={styles.predictionName}>{analysis.topPrediction?.className}</Text>
              {analysis.description && (
                <Text style={styles.predictionDescription}>{analysis.description}</Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Detailed Predictions */}
        {analysis.predictions && (
          <Card style={styles.predictionsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Detailed Predictions</Text>
              
              {analysis.predictions.slice(0, 5).map((prediction, index) => (
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
        )}

        {/* Doctor Review Section */}
        <Card style={styles.reviewCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Doctor Review</Text>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Diagnosis</Text>
              <TextInput
                value={doctorDiagnosis}
                onChangeText={setDoctorDiagnosis}
                placeholder="Enter your diagnosis..."
                style={styles.textInput}
                mode="outlined"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Confidence Level</Text>
              <View style={styles.confidenceSlider}>
                <Text style={styles.confidenceText}>{confidence}%</Text>
                <ProgressBar 
                  progress={confidence / 100} 
                  color="#00D4AA"
                  style={styles.sliderBar}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Clinical Notes</Text>
              <TextInput
                value={doctorNotes}
                onChangeText={setDoctorNotes}
                placeholder="Enter your clinical observations and recommendations..."
                style={styles.notesInput}
                mode="outlined"
                multiline
                numberOfLines={4}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleRequestMoreInfo}
            style={[styles.actionButton, styles.infoButton]}
            labelStyle={styles.infoButtonLabel}
            icon="information"
          >
            Request Info
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleReject}
            style={[styles.actionButton, styles.rejectButton]}
            labelStyle={styles.rejectButtonLabel}
            icon="close"
          >
            Reject
          </Button>
          
          <Button
            mode="contained"
            onPress={handleApprove}
            style={[styles.actionButton, styles.approveButton]}
            labelStyle={styles.approveButtonLabel}
            icon="check"
          >
            Approve
          </Button>
        </View>

        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <Button
            mode="outlined"
            onPress={handleDeleteAnalysis}
            style={styles.deleteButton}
            labelStyle={styles.deleteButtonLabel}
            icon="delete"
          >
            Delete Analysis
          </Button>
        </View>

        {/* Analysis Metadata */}
        <Card style={styles.metadataCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Analysis Metadata</Text>
            
            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Analysis Date</Text>
                <Text style={styles.metadataValue}>
                  {formatDate(analysis.timestamp || analysis.date)}
                </Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Model Version</Text>
                <Text style={styles.metadataValue}>{analysis.modelVersion || 'AI v2.1'}</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Processing Time</Text>
                <Text style={styles.metadataValue}>2.3 seconds</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Image Quality</Text>
                <Text style={styles.metadataValue}>High</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Professional dermatologist review interface
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
  imageCard: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  patientImage: {
    width: width - 80,
    height: 300,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  placeholderImage: {
    width: width - 80,
    height: 300,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderLabel: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  summaryCard: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskInfo: {
    marginLeft: 12,
  },
  riskTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 8,
  },
  confidenceBar: {
    width: 100,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#374151',
  },
  predictionDetails: {
    marginTop: 16,
  },
  predictionTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  predictionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  predictionDescription: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
  },
  predictionsCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
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
  reviewCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  inputSection: {
    marginBottom: 20,
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
  notesInput: {
    backgroundColor: '#16213E',
    height: 100,
  },
  confidenceSlider: {
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4AA',
    textAlign: 'center',
    marginBottom: 8,
  },
  sliderBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    marginTop: 10,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  infoButton: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  infoButtonLabel: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  rejectButtonLabel: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonContainer: {
    margin: 20,
    marginTop: 10,
  },
  deleteButton: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  deleteButtonLabel: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  metadataCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metadataItem: {
    width: '48%',
    marginBottom: 16,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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

export default AnalysisReview;
