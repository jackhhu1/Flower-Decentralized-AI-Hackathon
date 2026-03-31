import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  Alert,
  RefreshControl
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip,
  Surface,
  Text,
  IconButton,
  Searchbar,
  FAB
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import storageService from '../utils/storage';

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  // Refresh history when screen comes into focus (e.g., returning from results)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, selectedFilter, history]);

  const loadHistory = async () => {
    try {
      // Load from storage service
      const savedHistory = await storageService.getAnalysisHistory();
      
      // If no saved history, create some sample data for demo
      if (savedHistory.length === 0) {
        const sampleHistory = [
          {
            id: '1',
            timestamp: '2024-01-15T10:30:00Z',
            imageUri: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=center',
            topPrediction: {
              className: 'Melanoma',
              confidence: 87
            },
            riskLevel: 'High',
            saved: true,
            imageId: 'IMG_1705312200000',
            modelVersion: 'AI v2.1',
            description: 'Irregular border, multiple colors'
          },
          {
            id: '2',
            timestamp: '2024-01-14T14:20:00Z',
            imageUri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop&crop=center',
            topPrediction: {
              className: 'Melanocytic nevi',
              confidence: 92
            },
            riskLevel: 'Low',
            saved: true,
            imageId: 'IMG_1705225200000',
            modelVersion: 'AI v2.1',
            description: 'Regular round mole, uniform color'
          },
          {
            id: '3',
            timestamp: '2024-01-13T09:15:00Z',
            imageUri: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=center',
            topPrediction: {
              className: 'Basal cell carcinoma',
              confidence: 78
            },
            riskLevel: 'Medium',
            saved: true,
            imageId: 'IMG_1705138500000',
            modelVersion: 'AI v2.1',
            description: 'Pearl-like appearance, slow growing'
          },
          {
            id: '4',
            timestamp: '2024-01-12T16:45:00Z',
            imageUri: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop&crop=center',
            topPrediction: {
              className: 'Benign keratosis-like lesions',
              confidence: 85
            },
            riskLevel: 'Low',
            saved: true,
            imageId: 'IMG_1705046700000',
            modelVersion: 'AI v2.1',
            description: 'Waxy, scaly appearance'
          },
          {
            id: '5',
            timestamp: '2024-01-11T11:30:00Z',
            imageUri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop&crop=center',
            topPrediction: {
              className: 'Actinic keratoses',
              confidence: 73
            },
            riskLevel: 'Medium',
            saved: true,
            imageId: 'IMG_1704961800000',
            modelVersion: 'AI v2.1',
            description: 'Rough, scaly patches from sun damage'
          },
          {
            id: '6',
            timestamp: '2024-01-10T08:45:00Z',
            imageUri: 'mole_vascular_1.jpg',
            topPrediction: {
              className: 'Vascular lesions',
              confidence: 91
            },
            riskLevel: 'Low',
            saved: true,
            imageId: 'IMG_1704876300000',
            modelVersion: 'AI v2.1',
            description: 'Red or purple blood vessel growth'
          },
          {
            id: '7',
            timestamp: '2024-01-09T15:20:00Z',
            imageUri: 'mole_dermatofibroma_1.jpg',
            topPrediction: {
              className: 'Dermatofibroma',
              confidence: 88
            },
            riskLevel: 'Low',
            saved: true,
            imageId: 'IMG_1704790800000',
            modelVersion: 'AI v2.1',
            description: 'Firm, small brown bump'
          },
          {
            id: '8',
            timestamp: '2024-01-08T13:10:00Z',
            imageUri: 'mole_nevus_2.jpg',
            topPrediction: {
              className: 'Melanocytic nevi',
              confidence: 95
            },
            riskLevel: 'Low',
            saved: true,
            imageId: 'IMG_1704705000000',
            modelVersion: 'AI v2.1',
            description: 'Small, dark, well-defined mole'
          },
          {
            id: '9',
            timestamp: '2024-01-07T16:35:00Z',
            imageUri: 'mole_melanoma_2.jpg',
            topPrediction: {
              className: 'Melanoma',
              confidence: 82
            },
            riskLevel: 'High',
            saved: true,
            imageId: 'IMG_1704619500000',
            modelVersion: 'AI v2.1',
            description: 'Asymmetric shape, changing size'
          },
          {
            id: '10',
            timestamp: '2024-01-06T12:15:00Z',
            imageUri: 'mole_basal_cell_2.jpg',
            topPrediction: {
              className: 'Basal cell carcinoma',
              confidence: 76
            },
            riskLevel: 'Medium',
            saved: true,
            imageId: 'IMG_1704533700000',
            modelVersion: 'AI v2.1',
            description: 'Open sore that won\'t heal'
          },
          {
            id: '11',
            timestamp: '2024-01-05T09:40:00Z',
            imageUri: 'mole_keratosis_2.jpg',
            topPrediction: {
              className: 'Benign keratosis-like lesions',
              confidence: 89
            },
            riskLevel: 'Low',
            saved: true,
            imageId: 'IMG_1704448200000',
            modelVersion: 'AI v2.1',
            description: 'Light brown, warty texture'
          },
          {
            id: '12',
            timestamp: '2024-01-04T14:25:00Z',
            imageUri: 'mole_actinic_2.jpg',
            topPrediction: {
              className: 'Actinic keratoses',
              confidence: 81
            },
            riskLevel: 'Medium',
            saved: true,
            imageId: 'IMG_1704362700000',
            modelVersion: 'AI v2.1',
            description: 'Pink or red rough patches'
          }
        ];

        // Normalize confidence to 60-70%
        // Map class name to an appropriate risk level for consistent seeding
        const classRiskMap = {
          'Melanoma': 'High',
          'Basal cell carcinoma': 'Medium',
          'Actinic keratoses': 'Medium',
          'Benign keratosis-like lesions': 'Low',
          'Melanocytic nevi': 'Low',
          'Dermatofibroma': 'Low',
          'Vascular lesions': 'Low',
        };

        const seededHistory = sampleHistory.map((item, index) => {
          const confidence = 70 + Math.floor(Math.random() * 11);
          const className = item.topPrediction?.className;
          const derivedRisk = classRiskMap[className] || item.riskLevel || 'Low';
          return {
            ...item,
            // Set all timestamps to 2025-09-26, staggered hourly
            timestamp: new Date(Date.parse('2025-09-26T12:00:00Z') - index * 60 * 60 * 1000).toISOString(),
            topPrediction: {
              ...item.topPrediction,
              confidence,
            },
            riskLevel: derivedRisk,
          };
        });

        // Persist the seeded data so subsequent visits load from storage
        await storageService.setAnalysisHistory(seededHistory);
        setHistory(seededHistory);
      } else {
        setHistory(savedHistory);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Failed to load analysis history.');
    }
  };

  const filterHistory = () => {
    let filtered = history;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.topPrediction.className.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by risk level
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.riskLevel === selectedFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    setFilteredHistory(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return '#D32F2F';
      case 'Medium': return '#F57C00';
      case 'Low': return '#388E3C';
      default: return '#BDBDBD';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const deleteHistoryItem = (id) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this analysis from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setHistory(prev => prev.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  const viewDetails = (item) => {
    // In a real app, this would navigate to a detailed view
    const description = item.description ? `\nDescription: ${item.description}` : '';
    Alert.alert(
      'Analysis Details',
      `Date: ${formatDate(item.timestamp || item.date)}\nPrediction: ${item.topPrediction.className}\nConfidence: ${item.topPrediction.confidence}%\nRisk Level: ${item.riskLevel}${description}`,
      [{ text: 'OK' }]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <Card style={styles.historyCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.dateText}>{formatDate(item.timestamp || item.date)}</Text>
            <Text style={styles.predictionText}>{item.topPrediction.className}</Text>
          </View>
          <View style={styles.cardActions}>
            <Chip 
              mode="outlined" 
              textStyle={{ color: getRiskColor(item.riskLevel) }}
              style={{ borderColor: getRiskColor(item.riskLevel) }}
            >
              {item.riskLevel}
            </Chip>
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => viewDetails(item)}
            />
          </View>
        </View>
        
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence: {item.topPrediction.confidence}%</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${item.topPrediction.confidence}%`,
                  backgroundColor: getRiskColor(item.riskLevel)
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Button 
            mode="text" 
            onPress={() => viewDetails(item)}
            style={styles.detailsButton}
          >
            View Details
          </Button>
          <Button 
            mode="text" 
            onPress={() => deleteHistoryItem(item.id)}
            textColor="#D32F2F"
            style={styles.deleteButton}
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📊</Text>
      <Title style={styles.emptyStateTitle}>No Analysis History</Title>
      <Paragraph style={styles.emptyStateText}>
        Your skin analysis history will appear here. Start by capturing your first image!
      </Paragraph>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Camera')}
        style={styles.emptyStateButton}
      >
        Start First Analysis
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="#FFFFFF"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <View style={styles.logoContainer}>
              <Text style={styles.headerTitle}>Analysis History</Text>
              <Text style={styles.headerSubtitle}>
                {filteredHistory.length} {filteredHistory.length === 1 ? 'analysis' : 'analyses'} found
              </Text>
            </View>
            {__DEV__ ? (
              <IconButton
                icon="delete"
                size={22}
                iconColor="#FF5C5C"
                onPress={async () => {
                  try {
                    await storageService.clearAnalysisHistory();
                    await loadHistory();
                    Alert.alert('Reset', 'Analysis history cleared.');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to clear analysis history.');
                  }
                }}
              />
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </View>

      <View style={styles.content}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by condition..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <Chip
              selected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
              style={[styles.filterChip, selectedFilter === 'all' && styles.selectedFilterChip]}
              textStyle={styles.filterChipText}
            >
              All
            </Chip>
            <Chip
              selected={selectedFilter === 'High'}
              onPress={() => setSelectedFilter('High')}
              style={[styles.filterChip, selectedFilter === 'High' && styles.selectedFilterChip]}
              textStyle={[styles.filterChipText, { color: selectedFilter === 'High' ? '#FFFFFF' : '#EF4444' }]}
            >
              High Risk
            </Chip>
            <Chip
              selected={selectedFilter === 'Medium'}
              onPress={() => setSelectedFilter('Medium')}
              style={[styles.filterChip, selectedFilter === 'Medium' && styles.selectedFilterChip]}
              textStyle={[styles.filterChipText, { color: selectedFilter === 'Medium' ? '#FFFFFF' : '#F59E0B' }]}
            >
              Medium Risk
            </Chip>
            <Chip
              selected={selectedFilter === 'Low'}
              onPress={() => setSelectedFilter('Low')}
              style={[styles.filterChip, selectedFilter === 'Low' && styles.selectedFilterChip]}
              textStyle={[styles.filterChipText, { color: selectedFilter === 'Low' ? '#FFFFFF' : '#10B981' }]}
            >
              Low Risk
            </Chip>
          </ScrollView>
        </View>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => navigation.navigate('Camera')}
        label="New Analysis"
      />
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 8,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 48, // Same width as the back button to balance the layout
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00D4AA', // Teal
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB', // Light gray
    fontWeight: '400',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
    backgroundColor: '#1A1A2E', // Dark navy
  },
  filterContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  filterScrollContent: {
    paddingHorizontal: 4,
  },
  filterChip: {
    marginRight: 12,
    backgroundColor: '#1A1A2E', // Dark navy
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedFilterChip: {
    backgroundColor: '#00D4AA', // Teal
    borderColor: '#00D4AA',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  listContainer: {
    paddingBottom: 80,
  },
  historyCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#1A1A2E', // Dark navy
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceContainer: {
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#9CA3AF',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: '#9CA3AF',
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    backgroundColor: '#00D4AA', // Teal
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#00D4AA', // Teal
  },
});

export default HistoryScreen;
