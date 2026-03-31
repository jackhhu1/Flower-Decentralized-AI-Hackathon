# DermaCheck ML Service

This document explains how to run the local ML service for the DermaCheck app.

## Overview

The ML service provides a local API endpoint that runs the trained federated learning model for skin cancer detection. It processes images and returns predictions with confidence scores.

## Prerequisites

1. Python virtual environment with Flower dependencies installed
2. PyTorch and related ML libraries
3. Flask for the web service

## Setup

1. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Install additional dependencies:**
   ```bash
   pip install flask==2.3.3 flask-cors==4.0.0 pillow==10.0.0
   ```

3. **Start the ML service:**
   ```bash
   ./start_ml_service.sh
   ```
   
   Or manually:
   ```bash
   python ml_service.py
   ```

## API Endpoints

The service runs on `http://localhost:5000` and provides the following endpoints:

### Health Check
- **GET** `/health`
- Returns service status and model information

### Image Analysis
- **POST** `/analyze`
- **Body:** `{"image": "base64_encoded_image"}`
- Returns prediction results with confidence scores

### Model Information
- **GET** `/model/info`
- Returns model architecture and class information

### FL Statistics
- **GET** `/fl/statistics`
- Returns federated learning statistics (demo data)

## Response Format

The `/analyze` endpoint returns:

```json
{
  "predictions": [
    {
      "className": "Melanocytic nevi",
      "probability": 0.85,
      "confidence": 85,
      "classIndex": 0
    }
  ],
  "topPrediction": {
    "className": "Melanocytic nevi",
    "probability": 0.85,
    "confidence": 85,
    "classIndex": 0
  },
  "confidence": 85,
  "modelVersion": "federated-local-v1.0",
  "modelAccuracy": 0.85,
  "processingTime": 150,
  "analysisTime": "2024-01-01T00:00:00Z"
}
```

## Class Names

The model predicts 7 skin lesion classes:

1. Melanocytic nevi
2. Melanoma
3. Benign keratosis
4. Basal cell carcinoma
5. Actinic keratoses
6. Vascular lesions
7. Dermatofibroma

## Integration with Expo App

The Expo app is configured to use `http://localhost:5000` as the API base URL. When you run the ML service, the app will automatically connect to it for real image analysis.

## Troubleshooting

1. **Port 5000 already in use:**
   - Change the port in `ml_service.py` and update the API_BASE_URL in the Expo app

2. **Model not loading:**
   - Check that all dependencies are installed
   - Verify the medapp directory structure

3. **CORS errors:**
   - Ensure flask-cors is installed
   - Check that the service is running on the correct port

## Development Notes

- The current implementation uses a randomly initialized model for demo purposes
- In production, you would load a saved model state dict
- The service automatically resizes images to 28x28 pixels (DermMNIST format)
- All images are converted to RGB format before processing

