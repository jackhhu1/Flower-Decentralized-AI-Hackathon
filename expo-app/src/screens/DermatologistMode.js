import React, { useState, useEffect } from 'react';
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
  Chip,
  Searchbar,
  FAB
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import storageService from '../utils/storage';

const { width } = Dimensions.get('window');

const DermatologistMode = ({ navigation }) => {
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isDoctorMode, setIsDoctorMode] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [searchQuery, selectedFilter, analyses]);

  const loadAnalyses = async () => {
    try {
      const savedAnalyses = await storageService.getAnalysisHistory();
      setAnalyses(savedAnalyses);
    } catch (error) {
      console.error('Error loading analyses:', error);
      Alert.alert('Error', 'Failed to load analyses.');
    }
  };

  const filterAnalyses = () => {
    let filtered = analyses;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.topPrediction?.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.imageId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by risk level
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.riskLevel === selectedFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    setFilteredAnalyses(filtered);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleReviewAnalysis = (item) => {
    Alert.alert(
      'Review Analysis',
      `Patient ID: ${item.imageId}\nPrediction: ${item.topPrediction?.className}\nConfidence: ${item.topPrediction?.confidence}%\nRisk Level: ${item.riskLevel}\n\nWould you like to review this case?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Review', 
          style: 'default',
          onPress: () => {
            // Navigate to detailed review screen
            navigation.navigate('AnalysisReview', { analysis: item });
          }
        }
      ]
    );
  };

  const handleApproveAnalysis = async (item) => {
    try {
      // In a real app, this would update the analysis status
      Alert.alert('Approved', `Analysis ${item.imageId} has been approved by dermatologist.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve analysis.');
    }
  };

  const handleRejectAnalysis = async (item) => {
    try {
      // In a real app, this would update the analysis status
      Alert.alert('Rejected', `Analysis ${item.imageId} has been flagged for review.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject analysis.');
    }
  };

  const handleDeleteAnalysis = async (item) => {
    Alert.alert(
      'Delete Analysis',
      `Are you sure you want to delete this analysis for patient ${item.imageId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await storageService.deleteAnalysis(item.id);
              Alert.alert('Deleted', 'Analysis successfully deleted.');
              loadHistory(); // Reload history after deletion
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

  const renderAnalysisItem = ({ item }) => (
    <Card style={styles.analysisCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.imageContainer}>
            {item.imageUri ? (
              <Image 
                source={{ uri: item.imageUri }} 
                style={styles.analysisImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>📷</Text>
              </View>
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.patientId}>Patient: {item.imageId}</Text>
            <Text style={styles.dateText}>{formatDate(item.timestamp || item.date)}</Text>
            <Text style={styles.predictionText}>{item.topPrediction?.className}</Text>
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleReviewAnalysis(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#EF4444"
              onPress={() => handleDeleteAnalysis(item)}
            />
          </View>
        </View>
        
        <View style={styles.riskLevelContainer}>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getRiskColor(item.riskLevel) }}
            style={{ borderColor: getRiskColor(item.riskLevel) }}
          >
            {item.riskLevel}
          </Chip>
        </View>
        
        <View style={styles.analysisDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence:</Text>
            <Text style={styles.detailValue}>{item.topPrediction?.confidence}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>{item.modelVersion || 'AI v2.1'}</Text>
          </View>
          {item.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{item.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => handleRejectAnalysis(item)}
            style={[styles.actionButton, styles.rejectButton]}
            labelStyle={styles.rejectButtonLabel}
            icon="close"
          >
            Flag
          </Button>
          <Button
            mode="contained"
            onPress={() => handleApproveAnalysis(item)}
            style={[styles.actionButton, styles.approveButton]}
            labelStyle={styles.approveButtonLabel}
            icon="check"
          >
            Approve
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

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
              <Text style={styles.headerTitle}>Dermatologist Review</Text>
              <Text style={styles.headerSubtitle}>Professional analysis dashboard</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Doctor Mode Indicator */}
        <Card style={styles.modeCard}>
          <Card.Content>
            <View style={styles.modeIndicator}>
              <IconButton
                icon="doctor"
                size={24}
                iconColor="#00D4AA"
              />
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Doctor Mode Active</Text>
                <Text style={styles.modeSubtitle}>Review and approve AI analyses</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Statistics Overview */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Analysis Overview</Text>
            <View style={styles.statsGrid}>
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>{analyses.length}</Text>
                <Text style={styles.statLabel}>Total Cases</Text>
              </Surface>
              
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>
                  {analyses.filter(a => a.riskLevel === 'High').length}
                </Text>
                <Text style={styles.statLabel}>High Risk</Text>
              </Surface>
              
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>
                  {analyses.filter(a => a.riskLevel === 'Medium').length}
                </Text>
                <Text style={styles.statLabel}>Medium Risk</Text>
              </Surface>
              
              <Surface style={styles.statItem}>
                <Text style={styles.statValue}>
                  {analyses.filter(a => a.riskLevel === 'Low').length}
                </Text>
                <Text style={styles.statLabel}>Low Risk</Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        {/* Search and Filter */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <Searchbar
              placeholder="Search by patient ID or condition..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
              <Chip
                mode={selectedFilter === 'all' ? 'flat' : 'outlined'}
                selected={selectedFilter === 'all'}
                onPress={() => setSelectedFilter('all')}
                style={[styles.filterChip, selectedFilter === 'all' && styles.selectedFilterChip]}
                textStyle={styles.filterChipText}
              >
                All Cases
              </Chip>
              <Chip
                mode={selectedFilter === 'High' ? 'flat' : 'outlined'}
                selected={selectedFilter === 'High'}
                onPress={() => setSelectedFilter('High')}
                style={[styles.filterChip, selectedFilter === 'High' && styles.selectedFilterChip]}
                textStyle={styles.filterChipText}
              >
                High Risk
              </Chip>
              <Chip
                mode={selectedFilter === 'Medium' ? 'flat' : 'outlined'}
                selected={selectedFilter === 'Medium'}
                onPress={() => setSelectedFilter('Medium')}
                style={[styles.filterChip, selectedFilter === 'Medium' && styles.selectedFilterChip]}
                textStyle={styles.filterChipText}
              >
                Medium Risk
              </Chip>
              <Chip
                mode={selectedFilter === 'Low' ? 'flat' : 'outlined'}
                selected={selectedFilter === 'Low'}
                onPress={() => setSelectedFilter('Low')}
                style={[styles.filterChip, selectedFilter === 'Low' && styles.selectedFilterChip]}
                textStyle={styles.filterChipText}
              >
                Low Risk
              </Chip>
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Analysis List */}
        <View style={styles.analysesList}>
          {filteredAnalyses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No analyses found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </Card.Content>
            </Card>
          ) : (
            filteredAnalyses.map((item, index) => (
              <View key={item.id || index}>
                {renderAnalysisItem({ item })}
              </View>
            ))
          )}
        </View>

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
  modeCard: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  modeSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statsCard: {
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
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  filterCard: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  searchBar: {
    backgroundColor: '#16213E',
    marginBottom: 16,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterChip: {
    marginRight: 12,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedFilterChip: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  analysesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  analysisCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  analysisImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  patientId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLevelContainer: {
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  analysisDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#1A1A2E',
    elevation: 4,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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

export default DermatologistMode;
