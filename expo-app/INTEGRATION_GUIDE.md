# DermaCheck Integration Guide

This guide explains how to integrate the DermaCheck Expo app with your Flower federated learning backend.

## Backend Requirements

### API Endpoints

Your federated learning backend should provide the following REST API endpoints:

#### 1. Image Analysis Endpoint
```
POST /analyze
```

**Request Body:**
```json
{
  "image": {
    "data": "base64_encoded_image",
    "width": 28,
    "height": 28,
    "format": "jpeg"
  },
  "model_config": {
    "dataset": "dermamnist",
    "num_classes": 7,
    "model_type": "enhanced_cnn"
  },
  "analysis_options": {
    "return_confidence_scores": true,
    "return_feature_maps": false,
    "return_attention_weights": false
  }
}
```

**Response:**
```json
{
  "predictions": [
    {
      "probability": 0.85,
      "class_index": 4
    },
    {
      "probability": 0.10,
      "class_index": 5
    }
    // ... more predictions
  ],
  "metadata": {
    "processing_time_ms": 150,
    "fl_round": 42,
    "model_version": "federated-v1.0"
  },
  "model_info": {
    "version": "federated-v1.0",
    "accuracy": 0.89,
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Model Information Endpoint
```
GET /model/info
```

**Response:**
```json
{
  "version": "federated-v1.0",
  "accuracy": 0.89,
  "last_updated": "2024-01-15T10:30:00Z",
  "num_classes": 7,
  "input_shape": [28, 28, 3],
  "model_type": "enhanced_cnn"
}
```

#### 3. FL Statistics Endpoint
```
GET /fl/statistics
```

**Response:**
```json
{
  "current_round": 42,
  "total_clients": 8,
  "active_clients": 6,
  "model_accuracy": 0.89,
  "last_round_time": "2024-01-15T10:30:00Z"
}
```

#### 4. Feedback Endpoint
```
POST /feedback
```

**Request Body:**
```json
{
  "analysis_id": "analysis_123",
  "feedback": {
    "accuracy_rating": 4,
    "correct_prediction": true,
    "actual_diagnosis": "Melanoma",
    "comments": "Very accurate prediction",
    "user_experience": 5
  }
}
```

## Configuration

### 1. Update API Endpoint

Edit `src/services/apiService.js`:

```javascript
const API_BASE_URL = 'https://your-federated-learning-api.com';
```

### 2. Configure Model Parameters

The app is configured for the DermaMNIST dataset with 7 classes:

```javascript
// In apiService.js
const payload = {
  image: {
    data: imageData.base64,
    width: imageData.width,
    height: imageData.height,
    format: 'jpeg'
  },
  model_config: {
    dataset: 'dermamnist',
    num_classes: 7,
    model_type: 'enhanced_cnn'
  }
};
```

### 3. Class Mapping

The app maps class indices to human-readable names:

```javascript
const classNames = [
  'Actinic keratoses and intraepithelial carcinoma',  // Index 0
  'Basal cell carcinoma',                             // Index 1
  'Benign keratosis-like lesions',                    // Index 2
  'Dermatofibroma',                                   // Index 3
  'Melanoma',                                         // Index 4
  'Melanocytic nevi',                                 // Index 5
  'Vascular lesions'                                  // Index 6
];
```

## Image Processing

### Input Requirements

- **Size**: 28x28 pixels (DermaMNIST standard)
- **Format**: JPEG
- **Channels**: RGB (3 channels)
- **Encoding**: Base64 for API transmission

### Processing Pipeline

1. **Capture**: User takes photo with camera
2. **Resize**: Image resized to 28x28 pixels
3. **Convert**: Image converted to base64
4. **Validate**: Image data validated
5. **Transmit**: Sent to federated learning API
6. **Process**: Backend processes with FL model
7. **Return**: Results sent back to app

## Error Handling

The app includes comprehensive error handling:

- **Network errors**: Retry with exponential backoff
- **API errors**: User-friendly error messages
- **Image processing errors**: Fallback to simulation mode
- **Validation errors**: Clear error descriptions

## Security Considerations

### 1. Data Privacy
- Images are processed locally when possible
- Federated learning preserves data privacy
- No personal data stored on servers
- User controls data retention

### 2. API Security
- HTTPS required for all API calls
- Request timeout handling
- Input validation
- Error sanitization

### 3. Local Storage
- Analysis history stored locally
- User preferences encrypted
- No sensitive data in logs

## Testing

### 1. Unit Tests
```bash
npm test
```

### 2. Integration Tests
```bash
npm run test:integration
```

### 3. E2E Tests
```bash
npm run test:e2e
```

## Deployment

### 1. Development
```bash
npm start
```

### 2. Production Build
```bash
expo build:android
expo build:ios
```

### 3. App Store Submission
```bash
expo submit:android
expo submit:ios
```

## Monitoring

### 1. Analytics
- User engagement metrics
- Analysis success rates
- Error tracking
- Performance monitoring

### 2. Logging
- API request/response logs
- Error logs
- User action logs
- Performance metrics

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API endpoint URL
   - Verify network connectivity
   - Check API server status

2. **Image Processing Errors**
   - Verify image format support
   - Check file permissions
   - Validate image size

3. **Analysis Timeout**
   - Increase API timeout
   - Check server performance
   - Implement retry logic

### Debug Mode

Enable debug mode in `src/services/apiService.js`:

```javascript
const API_BASE_URL = 'https://your-api.com';
const DEBUG_MODE = true; // Enable detailed logging
```

## Support

For integration support:
- Check the logs for detailed error messages
- Verify API endpoint configuration
- Test with sample images
- Contact the development team

## Medical Disclaimer

⚠️ **Important**: This integration guide is for technical implementation only. The medical accuracy and safety of the skin cancer detection system depends entirely on the quality and validation of the federated learning model and training data. Always ensure proper medical validation and regulatory compliance before deployment.

