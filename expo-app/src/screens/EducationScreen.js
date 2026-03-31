import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  Linking
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
  List,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EducationScreen = ({ navigation }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  const skinCancerTypes = [
    {
      id: 'melanoma',
      name: 'Melanoma',
      description: 'The most dangerous form of skin cancer, often appearing as a new mole or a change in an existing mole.',
      symptoms: [
        'Asymmetrical shape',
        'Irregular borders',
        'Multiple colors',
        'Diameter larger than 6mm',
        'Evolving appearance'
      ],
      riskLevel: 'High',
      color: '#D32F2F',
      abcdRule: true
    },
    {
      id: 'basal-cell',
      name: 'Basal Cell Carcinoma',
      description: 'The most common type of skin cancer, usually appearing on sun-exposed areas.',
      symptoms: [
        'Pearly or waxy bump',
        'Flat, flesh-colored lesion',
        'Brown scar-like lesion',
        'Bleeding or scabbing sore'
      ],
      riskLevel: 'Medium',
      color: '#F57C00',
      abcdRule: false
    },
    {
      id: 'squamous-cell',
      name: 'Squamous Cell Carcinoma',
      description: 'Second most common skin cancer, often appearing as a firm, red nodule.',
      symptoms: [
        'Firm, red nodule',
        'Flat lesion with scaly surface',
        'New sore on old scar',
        'Rough patch on lip'
      ],
      riskLevel: 'Medium',
      color: '#F57C00',
      abcdRule: false
    },
    {
      id: 'actinic-keratosis',
      name: 'Actinic Keratosis',
      description: 'Precancerous lesions that can develop into squamous cell carcinoma.',
      symptoms: [
        'Rough, scaly patches',
        'Pink, red, or brown color',
        'Itching or burning sensation',
        'Size of a small coin'
      ],
      riskLevel: 'Low',
      color: '#388E3C',
      abcdRule: false
    }
  ];

  const preventionTips = [
    {
      title: 'Sun Protection',
      tips: [
        'Use broad-spectrum sunscreen (SPF 30+)',
        'Seek shade during peak sun hours (10 AM - 4 PM)',
        'Wear protective clothing and wide-brimmed hats',
        'Avoid tanning beds and sunlamps'
      ]
    },
    {
      title: 'Regular Self-Exams',
      tips: [
        'Check your skin monthly for new or changing moles',
        'Use the ABCDE rule for mole evaluation',
        'Take photos to track changes over time',
        'Examine all areas including scalp, between toes, and palms'
      ]
    },
    {
      title: 'Professional Care',
      tips: [
        'Schedule annual dermatologist visits',
        'Get immediate attention for concerning changes',
        'Consider mole mapping for high-risk individuals',
        'Discuss family history with your doctor'
      ]
    }
  ];

  const abcdRule = {
    title: 'ABCDE Rule for Melanoma Detection',
    rules: [
      { letter: 'A', word: 'Asymmetry', description: 'One half doesn\'t match the other half' },
      { letter: 'B', word: 'Border', description: 'Edges are irregular, ragged, or blurred' },
      { letter: 'C', word: 'Color', description: 'Color is not uniform, may include shades of brown, black, pink, red, white, or blue' },
      { letter: 'D', word: 'Diameter', description: 'Spot is larger than 6mm across (about the size of a pencil eraser)' },
      { letter: 'E', word: 'Evolving', description: 'The mole is changing in size, shape, or color' }
    ]
  };

  const emergencyContacts = [
    {
      name: 'American Cancer Society',
      phone: '1-800-227-2345',
      website: 'https://www.cancer.org'
    },
    {
      name: 'Skin Cancer Foundation',
      phone: '1-212-725-5176',
      website: 'https://www.skincancer.org'
    },
    {
      name: 'National Cancer Institute',
      phone: '1-800-422-6237',
      website: 'https://www.cancer.gov'
    }
  ];

  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const openWebsite = (url) => {
    Linking.openURL(url);
  };

  const makePhoneCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderCancerTypeCard = (cancerType) => (
    <Card 
      key={cancerType.id} 
      style={[styles.cancerCard, { borderLeftColor: cancerType.color }]}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Title style={styles.cardTitle}>{cancerType.name}</Title>
            <Chip 
              mode="outlined" 
              textStyle={{ color: cancerType.color }}
              style={{ borderColor: cancerType.color }}
            >
              {cancerType.riskLevel} Risk
            </Chip>
          </View>
          <IconButton
            icon={expandedCard === cancerType.id ? 'chevron-up' : 'chevron-down'}
            onPress={() => toggleCard(cancerType.id)}
          />
        </View>
        
        <Paragraph style={styles.cardDescription}>
          {cancerType.description}
        </Paragraph>
        
        {expandedCard === cancerType.id && (
          <View style={styles.expandedContent}>
            <Text style={styles.symptomsTitle}>Common Symptoms:</Text>
            {cancerType.symptoms.map((symptom, index) => (
              <Text key={index} style={styles.symptomItem}>
                • {symptom}
              </Text>
            ))}
            
            {cancerType.abcdRule && (
              <View style={styles.abcdNote}>
                <Text style={styles.abcdNoteText}>
                  ⚠️ Use the ABCDE rule to evaluate this type of lesion
                </Text>
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderPreventionSection = (section) => (
    <Card key={section.title} style={styles.preventionCard}>
      <Card.Content>
        <Title style={styles.preventionTitle}>{section.title}</Title>
        {section.tips.map((tip, index) => (
          <Text key={index} style={styles.preventionTip}>
            • {tip}
          </Text>
        ))}
      </Card.Content>
    </Card>
  );

  const renderABCDRule = () => (
    <Card style={styles.abcdCard}>
      <Card.Content>
        <Title style={styles.abcdTitle}>{abcdRule.title}</Title>
        <Paragraph style={styles.abcdDescription}>
          Use this guide to help identify potentially dangerous moles:
        </Paragraph>
        
        {abcdRule.rules.map((rule, index) => (
          <View key={index} style={styles.abcdRuleItem}>
            <View style={styles.abcdLetter}>
              <Text style={styles.abcdLetterText}>{rule.letter}</Text>
            </View>
            <View style={styles.abcdContent}>
              <Text style={styles.abcdWord}>{rule.word}</Text>
              <Text style={styles.abcdDescription}>{rule.description}</Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderEmergencyContacts = () => (
    <Card style={styles.emergencyCard}>
      <Card.Content>
        <Title style={styles.emergencyTitle}>Emergency Resources</Title>
        <Paragraph style={styles.emergencyDescription}>
          If you notice any concerning changes in your skin, contact these resources immediately:
        </Paragraph>
        
        {emergencyContacts.map((contact, index) => (
          <View key={index} style={styles.contactItem}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={styles.contactActions}>
              <Button 
                mode="outlined" 
                onPress={() => makePhoneCall(contact.phone)}
                style={styles.contactButton}
                icon="phone"
              >
                Call
              </Button>
              <Button 
                mode="text" 
                onPress={() => openWebsite(contact.website)}
                style={styles.contactButton}
                icon="web"
              >
                Website
              </Button>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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
              <Text style={styles.headerTitle}>Skin Cancer Education</Text>
              <Text style={styles.headerSubtitle}>Learn about detection, prevention, and treatment</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

      <View style={styles.content}>
        {/* ABCD Rule */}
        {renderABCDRule()}

        {/* Cancer Types */}
        <Title style={styles.sectionTitle}>Types of Skin Cancer</Title>
        {skinCancerTypes.map(renderCancerTypeCard)}

        {/* Prevention Tips */}
        <Title style={styles.sectionTitle}>Prevention & Early Detection</Title>
        {preventionTips.map(renderPreventionSection)}

        {/* Emergency Contacts */}
        {renderEmergencyContacts()}

        {/* Disclaimer */}
        <Card style={styles.disclaimerCard}>
          <Card.Content>
            <Text style={styles.disclaimerText}>
              ⚠️ This educational content is for informational purposes only and should not 
              replace professional medical advice. Always consult a qualified healthcare 
              provider for medical concerns or questions about your skin health.
            </Text>
          </Card.Content>
        </Card>
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
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#00D4AA', // Teal
  },
  cancerCard: {
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    backgroundColor: '#1A1A2E', // Dark navy
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: '#E5E7EB',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  symptomsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#00D4AA', // Teal
  },
  symptomItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    color: '#9CA3AF',
  },
  abcdNote: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
  },
  abcdNoteText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  abcdCard: {
    marginBottom: 20,
    elevation: 4,
    backgroundColor: '#1A1A2E', // Dark navy
    borderRadius: 12,
  },
  abcdTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4AA', // Teal
    marginBottom: 8,
  },
  abcdDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: '#E5E7EB',
  },
  abcdRuleItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  abcdLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D4AA', // Teal
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  abcdLetterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  abcdContent: {
    flex: 1,
  },
  abcdWord: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4AA', // Teal
    marginBottom: 2,
  },
  preventionCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#1A1A2E', // Dark navy
    borderRadius: 12,
  },
  preventionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00D4AA', // Teal
    marginBottom: 8,
  },
  preventionTip: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    color: '#9CA3AF',
  },
  emergencyCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: '#1A1A2E', // Dark navy
    borderRadius: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444', // Red
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: '#E5E7EB',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    color: '#FFFFFF',
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactButton: {
    marginLeft: 8,
  },
  disclaimerCard: {
    backgroundColor: '#1A1A2E', // Dark navy
    elevation: 2,
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#F59E0B', // Orange
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default EducationScreen;
