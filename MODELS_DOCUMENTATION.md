# DermMNIST Skin Cancer Classification Models

## Overview
This implementation provides three optimized models for classifying skin cancer types using the DermMNIST dataset (7 classes of dermatoscopic images). The models are designed to maximize accuracy for skin lesion classification in a federated learning environment.

## DermMNIST Dataset Classes
The dataset contains 10,015 dermatoscopic images across 7 classes:

1. **Melanocytic nevi (NV)** - Common benign moles
2. **Melanoma (MEL)** - Serious form of skin cancer  
3. **Benign keratosis-like lesions (BKL)** - Seborrheic keratoses and solar lentigines
4. **Basal cell carcinoma (BCC)** - Common type of skin cancer
5. **Actinic keratoses (AKIEC)** - Pre-cancerous lesions
6. **Vascular lesions (VASC)** - Angiomas and hemorrhages
7. **Dermatofibroma (DF)** - Benign fibrous nodules

## Three Optimized Models

### Model 1: Enhanced CNN with Attention Mechanisms (`enhanced_cnn`)
**Architecture Features:**
- Custom CNN with 4 convolutional blocks
- Channel attention mechanism for enhanced feature learning
- Batch normalization for stable training
- Global average pooling to reduce overfitting
- Dropout layers for regularization
- Focal loss for handling class imbalance

**Key Differentiators:**
- **Attention Mechanism**: Focuses on important features in skin lesions
- **Focal Loss**: Addresses class imbalance common in medical datasets
- **Advanced Architecture**: Deeper network with better feature extraction

**Configuration:**
- Learning Rate: 0.001
- Uses Focal Loss: Yes
- Optimized for: Feature attention and class imbalance

### Model 2: ResNet-based Transfer Learning (`resnet`)
**Architecture Features:**
- ResNet18 backbone with pretrained ImageNet weights
- Transfer learning approach for medical imaging
- Custom classifier head with dropout
- Differential learning rates (lower for backbone, higher for classifier)

**Key Differentiators:**
- **Transfer Learning**: Leverages pretrained features from ImageNet
- **Residual Connections**: Helps with gradient flow in deeper networks
- **Fine-tuning Strategy**: Preserves learned features while adapting to medical domain

**Configuration:**
- Learning Rate: 0.0001 (backbone: 0.00001)
- Uses Focal Loss: No (uses CrossEntropy)
- Optimized for: Transfer learning and feature reuse

### Model 3: EfficientNet-based Medical Imaging (`efficientnet`)
**Architecture Features:**
- EfficientNet-B0 backbone with pretrained weights
- Compound scaling for optimal efficiency
- Custom classifier with medical imaging focus
- Focal loss for class imbalance

**Key Differentiators:**
- **Efficient Architecture**: Better accuracy per parameter
- **Compound Scaling**: Optimized depth, width, and resolution
- **Medical Focus**: Specialized for medical imaging tasks

**Configuration:**
- Learning Rate: 0.0001
- Uses Focal Loss: Yes
- Optimized for: Efficiency and medical imaging

## Advanced Features Implemented

### 1. Focal Loss for Class Imbalance
```python
class FocalLoss(nn.Module):
    def __init__(self, alpha=1, gamma=2, reduction='mean'):
        # Focuses learning on hard examples
        # Reduces impact of easy examples
```

### 2. Enhanced Data Augmentation
```python
def get_skin_lesion_transforms(is_training=True):
    # RandomResizedCrop, RandomHorizontalFlip, RandomVerticalFlip
    # RandomRotation, ColorJitter, RandomAffine
    # ImageNet normalization for pretrained models
```

### 3. Channel Attention Mechanism
```python
class AttentionBlock(nn.Module):
    # Global average and max pooling
    # Channel-wise attention weights
    # Enhanced feature learning
```

### 4. Model Selection System
```python
def get_model(model_type: str, num_classes: int):
    # Dynamic model selection
    # Configuration management
    # Easy switching between models
```

## Key Differentiators for Skin Cancer Classification

### Visual Features Each Model Captures:

1. **Color Distribution**: 
   - Melanoma: Irregular pigmentation patterns
   - Basal cell carcinoma: Pearly, translucent appearance
   - Vascular lesions: Red/pink coloration

2. **Texture Patterns**:
   - Melanocytic nevi: Regular, uniform texture
   - Dermatofibroma: Firm, raised texture
   - Benign keratosis: Rough, scaly surface

3. **Shape and Border Irregularities**:
   - Melanoma: Asymmetric shape, irregular borders
   - Benign lesions: Regular, well-defined borders

4. **Size and Evolution**:
   - Malignant lesions: Often larger, changing over time
   - Benign lesions: Stable size and appearance

## Usage Instructions

### Running Different Models:

1. **Enhanced CNN**:
```bash
flwr run --stream --run-config="model-type='enhanced_cnn' dataset='dermamnist' num-classes=7"
```

2. **ResNet-based**:
```bash
flwr run --stream --run-config="model-type='resnet' dataset='dermamnist' num-classes=7"
```

3. **EfficientNet-based**:
```bash
flwr run --stream --run-config="model-type='efficientnet' dataset='dermamnist' num-classes=7"
```

### Configuration Options:
- `model-type`: Choose between "enhanced_cnn", "resnet", "efficientnet", or "default"
- `dataset`: Set to "dermamnist" for skin lesion classification
- `num-classes`: Set to 7 for DermMNIST
- `use-wandb`: Enable Weights & Biases logging
- `local-epochs`: Number of local training epochs
- `num-server-rounds`: Federated learning rounds

## Expected Performance Characteristics

### Model Comparison:
- **Enhanced CNN**: Best for attention-based feature learning, handles class imbalance well
- **ResNet**: Good transfer learning performance, stable training
- **EfficientNet**: Best efficiency, good for resource-constrained environments

### Accuracy Optimizations:
1. **Attention mechanisms** focus on lesion-specific features
2. **Focal loss** addresses class imbalance in medical datasets
3. **Advanced augmentation** increases dataset diversity
4. **Transfer learning** leverages pretrained features
5. **Differential learning rates** optimize fine-tuning

## Medical Imaging Considerations

### Preprocessing:
- ImageNet normalization for pretrained models
- Appropriate augmentation for medical images
- Preservation of diagnostic features

### Class Imbalance Handling:
- Focal loss reduces impact of majority classes
- Attention mechanisms focus on minority class features
- Balanced sampling strategies

### Feature Learning:
- Channel attention highlights important visual features
- Transfer learning adapts general features to medical domain
- Efficient architectures optimize for medical imaging constraints

This implementation provides a comprehensive solution for skin cancer classification using federated learning, with three distinct approaches optimized for different aspects of the problem.

