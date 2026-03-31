# DermaCheck - AI-Powered Skin Cancer Detection

A React Native Expo app for dermatology skin cancer detection using federated learning technology. This app integrates with the Flower federated learning framework to provide privacy-preserving AI analysis of skin images.

## Features

### 🔬 AI-Powered Analysis
- **Federated Learning Integration**: Uses Flower framework for privacy-preserving AI
- **Real-time Skin Analysis**: Capture and analyze skin images instantly
- **Multiple Cancer Types**: Detects 7 different types of skin conditions
- **Confidence Scoring**: Provides detailed confidence levels for predictions

### 📱 User Experience
- **Intuitive Camera Interface**: Easy-to-use camera with capture guidelines
- **Comprehensive Results**: Detailed analysis with risk assessment
- **Analysis History**: Track and manage past analyses
- **Educational Content**: Learn about different types of skin cancer

### 🔒 Privacy & Security
- **Federated Learning**: Your data stays on your device
- **No Data Collection**: Images are processed locally when possible
- **Secure API**: Encrypted communication with federated learning servers
- **User Control**: Full control over data retention and sharing

## Supported Skin Conditions

The app can detect and classify the following conditions based on the DermaMNIST dataset:

1. **Actinic keratoses and intraepithelial carcinoma** - Pre-cancerous lesions
2. **Basal cell carcinoma** - Most common type of skin cancer
3. **Benign keratosis-like lesions** - Non-cancerous growths
4. **Dermatofibroma** - Benign skin growths
5. **Melanoma** - Most dangerous form of skin cancer
6. **Melanocytic nevi** - Moles and birthmarks
7. **Vascular lesions** - Blood vessel abnormalities

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd expo-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Configuration

### API Configuration
Update the API endpoint in `src/services/apiService.js`:

```javascript
const API_BASE_URL = 'https://your-federated-learning-api.com';
```

### Model Configuration
The app is configured to work with the DermaMNIST dataset and expects:
- Input image size: 28x28 pixels
- Number of classes: 7
- Model type: Enhanced CNN with attention mechanisms

## Architecture

### Frontend (React Native/Expo)
- **Screens**: Home, Camera, Results, History, Education
- **Services**: API integration, image processing, local storage
- **Utils**: Image preprocessing, data validation, error handling

### Backend Integration
- **Federated Learning**: Flower framework integration
- **Model**: Enhanced CNN with attention blocks
- **API**: RESTful API for analysis requests
- **Privacy**: Federated learning preserves data privacy

### Data Flow
1. User captures skin image
2. Image is preprocessed (resized to 28x28)
3. Image is sent to federated learning API
4. AI model analyzes the image
5. Results are returned with confidence scores
6. Analysis is saved to local history

## Key Components

### Screens
- **HomeScreen**: Main dashboard with quick actions
- **CameraScreen**: Image capture with guidelines
- **ResultsScreen**: Detailed analysis results
- **HistoryScreen**: Past analysis management
- **EducationScreen**: Educational content about skin cancer

### Services
- **ApiService**: Handles communication with federated learning backend
- **ImageProcessor**: Processes images for model input
- **StorageService**: Manages local data storage

### Utils
- **Image Processing**: Resize, convert, and validate images
- **Storage**: Local data persistence and management
- **Error Handling**: Comprehensive error management

## Usage

### Taking an Analysis
1. Open the app and tap "Start Analysis"
2. Follow the capture guidelines for best results
3. Take a clear photo of the skin area
4. Review the captured image
5. Tap "Analyze Image" to get results

### Understanding Results
- **Primary Prediction**: Most likely diagnosis
- **Confidence Score**: How certain the AI is (0-100%)
- **Risk Level**: High, Medium, or Low risk assessment
- **All Predictions**: Complete list of possible conditions
- **Recommendations**: Next steps based on results

### Managing History
- View all past analyses
- Filter by risk level or date
- Delete unwanted analyses
- Share results with healthcare providers

## Medical Disclaimer

⚠️ **Important**: This app is for educational and informational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider, especially a dermatologist, for any concerns about your skin health.

## Privacy Policy

- Images are processed locally when possible
- Federated learning ensures your data privacy
- No personal data is collected or stored on servers
- You have full control over your analysis history
- All data can be deleted at any time

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, questions, or feedback:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Acknowledgments

- Flower framework for federated learning capabilities
- DermaMNIST dataset for training data
- React Native and Expo communities
- Medical professionals who provided guidance

## Roadmap

- [ ] Real-time camera analysis
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Integration with health records
- [ ] Advanced image preprocessing
- [ ] Model performance metrics
- [ ] User feedback integration
- [ ] Telemedicine integration

