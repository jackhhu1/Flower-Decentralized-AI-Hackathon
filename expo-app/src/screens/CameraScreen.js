import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button, Surface, Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(true);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };


  const analyzeImage = async () => {
    if (!capturedImage) {
      Alert.alert('No Image', 'Please capture or select an image first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate dummy analysis results
      const dummyResults = {
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
      
      navigation.navigate('Results', {
        imageUri: capturedImage,
        results: dummyResults,
      });
    } catch (error) {
      Alert.alert('Analysis Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };


  const retakePicture = () => {
    setCapturedImage(null);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Button mode="contained" onPress={requestPermission} style={styles.button}>
          Request Camera Permission
        </Button>
        <Button mode="outlined" onPress={pickImage} style={styles.button}>
          Select from Gallery
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={setCameraRef}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.cameraOverlay}
            >
              <View style={styles.topControls}>
                <IconButton
                  icon="close"
                  size={28}
                  iconColor="#FFFFFF"
                  onPress={() => navigation.goBack()}
                  style={styles.closeButton}
                />
              </View>
              
                  {/* Capture Frame Overlay */}
                  <View style={styles.captureFrameContainer}>
                    <View style={styles.captureFrame}>
                      <View style={styles.captureFrameCorner} style={[styles.captureFrameCorner, styles.topLeft]} />
                      <View style={styles.captureFrameCorner} style={[styles.captureFrameCorner, styles.topRight]} />
                      <View style={styles.captureFrameCorner} style={[styles.captureFrameCorner, styles.bottomLeft]} />
                      <View style={styles.captureFrameCorner} style={[styles.captureFrameCorner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.captureFrameText}>Align lesion within frame</Text>
                  </View>

                  {showGuidelines && (
                    <View style={styles.instructionsContainer}>
                      <View style={styles.instructionCard}>
                        <View style={styles.instructionHeader}>
                          <Text style={styles.instructionTitle}>Capture Guidelines</Text>
                          <IconButton
                            icon="close"
                            size={24}
                            iconColor="#FFFFFF"
                            onPress={() => setShowGuidelines(false)}
                            style={styles.guidelinesCloseButton}
                          />
                        </View>
                        <Text style={styles.instructionText}>
                          • Ensure good lighting{'\n'}
                          • Keep skin lesion centered{'\n'}
                          • Fill the frame with the lesion{'\n'}
                          • Hold camera steady{'\n'}
                          • Align lesion within the capture frame
                        </Text>
                      </View>
                    </View>
                  )}
              
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                  <Text style={styles.galleryButtonText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.guidelinesButton} 
                  onPress={() => setShowGuidelines(true)}
                >
                  <Text style={styles.guidelinesButtonText}>?</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </CameraView>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          {/* Header with close button */}
          <View style={styles.previewHeader}>
            <IconButton
              icon="close"
              size={28}
              iconColor="#FFFFFF"
              onPress={() => navigation.goBack()}
              style={styles.previewCloseButton}
            />
            <Text style={styles.previewTitle}>Image Preview</Text>
            <View style={styles.previewSpacer} />
          </View>

          {/* Image Preview */}
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: capturedImage }} 
              style={styles.capturedImage}
              resizeMode="contain"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={styles.retakeButton}
              onPress={retakePicture}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Analyzing Indicator */}
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <View style={styles.analyzingCard}>
                <ActivityIndicator size="large" color="#00D4AA" />
                <Text style={styles.analyzingTitle}>Analyzing Image</Text>
                <Text style={styles.analyzingText}>
                  Running federated AI model analysis...
                </Text>
                <Text style={styles.analyzingSubtext}>
                  This may take a few moments
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingLeft: 20,
  },
      closeButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 25,
        width: 50,
        height: 50,
      },
      captureFrameContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -75 }, { translateY: -75 }],
        alignItems: 'center',
      },
      captureFrame: {
        width: 150,
        height: 150,
        position: 'relative',
      },
      captureFrameCorner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00D4AA',
        borderWidth: 3,
      },
      topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      },
      topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
      },
      bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
      },
      bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
      },
      captureFrameText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
      },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  guidelinesCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
  },
  instructionText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    paddingBottom: 50,
  },
  galleryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  captureButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#00D4AA',
    elevation: 8,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#00D4AA',
  },
  guidelinesButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelinesButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  previewSpacer: {
    width: 50,
  },
  imagePreviewContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 50,
    gap: 20,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 18,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#00D4AA',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 4,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingCard: {
    backgroundColor: '#1A1A2E',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  analyzingText: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 8,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});

export default CameraScreen;
