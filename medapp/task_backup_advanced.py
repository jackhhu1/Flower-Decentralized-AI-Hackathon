"""medapp: Advanced Flower / PyTorch federated learning app for skin lesion classification.

Based on successful HAM10000 ResNet18 approaches achieving 90%+ accuracy.
Implements advanced techniques: transfer learning, advanced augmentation, 
ensemble methods, and sophisticated class balancing.
"""

import os
import numpy as np
import random
from collections import defaultdict, Counter
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight
import warnings
warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader, WeightedRandomSampler
import wandb
from datasets import load_from_disk
from flwr.app import ArrayRecord, Context, Message, MetricRecord, RecordDict

# Set random seeds for reproducibility
torch.manual_seed(42)
np.random.seed(42)
random.seed(42)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False


class AdvancedResNet18(nn.Module):
    """Advanced ResNet18 with transfer learning and custom head for skin lesion classification"""
    
    def __init__(self, num_classes=7, pretrained=True, dropout_rate=0.5):
        super(AdvancedResNet18, self).__init__()
        
        # Load pretrained ResNet18
        if pretrained:
            self.backbone = torchvision.models.resnet18(weights='IMAGENET1K_V1')
            print("✅ Using ImageNet pretrained ResNet18")
        else:
            self.backbone = torchvision.models.resnet18(weights=None)
            print("⚠️  Using ResNet18 without pretrained weights")
        
        # Get the number of features from the last layer
        num_features = self.backbone.fc.in_features
        
        # Replace the final layer with our custom head
        self.backbone.fc = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(num_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(256, num_classes)
        )
        
        # Freeze early layers for transfer learning
        self.freeze_early_layers()
        
    def freeze_early_layers(self):
        """Freeze early layers for transfer learning"""
        for name, param in self.backbone.named_parameters():
            if 'layer1' in name or 'layer2' in name:
                param.requires_grad = False
        print("🔒 Frozen early layers (layer1, layer2) for transfer learning")
    
    def unfreeze_all_layers(self):
        """Unfreeze all layers for fine-tuning"""
        for param in self.backbone.parameters():
            param.requires_grad = True
        print("🔓 Unfrozen all layers for fine-tuning")
    
    def forward(self, x):
        return self.backbone(x)


class EfficientNetB0(nn.Module):
    """EfficientNet-B0 with transfer learning for skin lesion classification"""
    
    def __init__(self, num_classes=7, pretrained=True, dropout_rate=0.3):
        super(EfficientNetB0, self).__init__()
        
        # Load pretrained EfficientNet-B0
        if pretrained:
            self.backbone = torchvision.models.efficientnet_b0(weights='IMAGENET1K_V1')
            print("✅ Using ImageNet pretrained EfficientNet-B0")
        else:
            self.backbone = torchvision.models.efficientnet_b0(weights=None)
            print("⚠️  Using EfficientNet-B0 without pretrained weights")
        
        # Get the number of features from the classifier
        num_features = self.backbone.classifier[1].in_features
        
        # Replace the classifier with our custom head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(num_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(512, num_classes)
        )
        
        # Freeze early layers
        self.freeze_early_layers()
        
    def freeze_early_layers(self):
        """Freeze early layers for transfer learning"""
        for name, param in self.backbone.named_parameters():
            if 'features.0' in name or 'features.1' in name or 'features.2' in name:
                param.requires_grad = False
        print("🔒 Frozen early layers for transfer learning")
    
    def forward(self, x):
        return self.backbone(x)


class DenseNet121(nn.Module):
    """DenseNet121 with transfer learning for skin lesion classification"""
    
    def __init__(self, num_classes=7, pretrained=True, dropout_rate=0.4):
        super(DenseNet121, self).__init__()
        
        # Load pretrained DenseNet121
        if pretrained:
            self.backbone = torchvision.models.densenet121(weights='IMAGENET1K_V1')
            print("✅ Using ImageNet pretrained DenseNet121")
        else:
            self.backbone = torchvision.models.densenet121(weights=None)
            print("⚠️  Using DenseNet121 without pretrained weights")
        
        # Get the number of features from the classifier
        num_features = self.backbone.classifier.in_features
        
        # Replace the classifier with our custom head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(num_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(512, num_classes)
        )
        
        # Freeze early layers
        self.freeze_early_layers()
        
    def freeze_early_layers(self):
        """Freeze early layers for transfer learning"""
        for name, param in self.backbone.named_parameters():
            if 'features.denseblock1' in name or 'features.denseblock2' in name:
                param.requires_grad = False
        print("🔒 Frozen early layers for transfer learning")
    
    def forward(self, x):
        return self.backbone(x)


class EnsembleModel(nn.Module):
    """Ensemble of multiple models for improved accuracy"""
    
    def __init__(self, models, num_classes=7):
        super(EnsembleModel, self).__init__()
        self.models = nn.ModuleList(models)
        self.num_classes = num_classes
        
        # Learnable weights for ensemble
        self.ensemble_weights = nn.Parameter(torch.ones(len(models)) / len(models))
        
    def forward(self, x):
        outputs = []
        for model in self.models:
            outputs.append(model(x))
        
        # Weighted average of predictions
        weighted_outputs = []
        for i, output in enumerate(outputs):
            weighted_outputs.append(self.ensemble_weights[i] * output)
        
        return torch.stack(weighted_outputs, dim=0).sum(dim=0)


class FocalLoss(nn.Module):
    """Focal Loss for addressing class imbalance"""
    
    def __init__(self, alpha=1, gamma=2, reduction='mean'):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction
        
    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss


class LabelSmoothingLoss(nn.Module):
    """Label Smoothing Loss for better generalization"""
    
    def __init__(self, num_classes=7, smoothing=0.1):
        super(LabelSmoothingLoss, self).__init__()
        self.num_classes = num_classes
        self.smoothing = smoothing
        
    def forward(self, inputs, targets):
        log_preds = F.log_softmax(inputs, dim=1)
        true_dist = torch.zeros_like(log_preds)
        true_dist.fill_(self.smoothing / (self.num_classes - 1))
        true_dist.scatter_(1, targets.unsqueeze(1), 1 - self.smoothing)
        return torch.mean(torch.sum(-true_dist * log_preds, dim=1))


def get_advanced_transforms(is_training=True, image_size=224):
    """Advanced data augmentation pipeline for skin lesion classification"""
    
    if is_training:
        return transforms.Compose([
            transforms.Resize((image_size + 32, image_size + 32)),
            transforms.RandomResizedCrop(image_size, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.3),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
            transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
            transforms.RandomPerspective(distortion_scale=0.1, p=0.3),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            transforms.RandomErasing(p=0.2, scale=(0.02, 0.1), ratio=(0.3, 3.3))
        ])
    else:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])


def get_class_weights(dataset):
    """Calculate class weights for handling imbalance"""
    labels = []
    for item in dataset:
        if isinstance(item, dict):
            labels.append(item['label'].item())
        else:
            labels.append(item[1].item())
    
    class_counts = Counter(labels)
    total_samples = len(labels)
    
    # Calculate weights inversely proportional to class frequency
    class_weights = {}
    for class_id, count in class_counts.items():
        class_weights[class_id] = total_samples / (len(class_counts) * count)
    
    # Convert to tensor
    weights = torch.FloatTensor([class_weights[i] for i in range(len(class_counts))])
    return weights


def create_weighted_sampler(dataset):
    """Create weighted sampler for balanced training"""
    labels = []
    for item in dataset:
        if isinstance(item, dict):
            labels.append(item['label'].item())
        else:
            labels.append(item[1].item())
    
    class_counts = Counter(labels)
    total_samples = len(labels)
    
    # Calculate sample weights
    sample_weights = []
    for item in dataset:
        if isinstance(item, dict):
            label = item['label'].item()
        else:
            label = item[1].item()
        
        weight = total_samples / (len(class_counts) * class_counts[label])
        sample_weights.append(weight)
    
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True
    )


def apply_transforms(batch):
    """Apply transforms to batch data"""
    if isinstance(batch, dict):
        return {
            "image": batch["image"],
            "label": batch["label"]
        }
    else:
        return batch


def load_data(data_path: str, is_training: bool = True):
    """Load and prepare DermMNIST dataset with proper 28x28 image handling"""
    print(f"📂 Loading {'training' if is_training else 'test'} data from {data_path}")
    
    dataset = load_from_disk(data_path)
    dataset = dataset.with_format("torch")
    
    # DermMNIST-specific transforms for 28x28 images
    if is_training:
        transforms_pipeline = transforms.Compose([
            transforms.Resize((224, 224)),  # Resize 28x28 to 224x224 for ResNet
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=10),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    else:
        transforms_pipeline = transforms.Compose([
            transforms.Resize((224, 224)),  # Resize 28x28 to 224x224 for ResNet
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def transform_batch(batch):
        """Transform DermMNIST batch data to proper format"""
        from PIL import Image
        import numpy as np
        
        # Get the image data
        img_data = batch["image"]
        
        # Convert to numpy array if it's a list
        if isinstance(img_data, list):
            img_array = np.array(img_data)
        else:
            img_array = img_data.numpy() if hasattr(img_data, 'numpy') else img_data
        
        # Handle different data formats - the issue is that we're getting batched data
        if len(img_array.shape) == 4:
            # This is a batch of images: (batch_size, H, W, C) or (batch_size, C, H, W)
            if img_array.shape[1] == 3 or img_array.shape[3] == 3:
                # Take the first image from the batch
                if img_array.shape[1] == 3:
                    # (batch_size, C, H, W) -> (C, H, W)
                    img_array = img_array[0].transpose(1, 2, 0)
                else:
                    # (batch_size, H, W, C) -> (H, W, C)
                    img_array = img_array[0]
            else:
                # Take first image and try to reshape
                img_array = img_array[0]
                if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                    # Already correct (H, W, C)
                    pass
                else:
                    # Try to reshape to 28x28x3
                    if img_array.size == 28 * 28 * 3:
                        img_array = img_array.reshape(28, 28, 3)
                    elif img_array.size == 28 * 28:
                        img_array = img_array.reshape(28, 28)
                        img_array = np.stack([img_array, img_array, img_array], axis=-1)
                    else:
                        # Fallback: create a 28x28x3 image
                        print(f"⚠️  Unexpected batch image shape: {img_array.shape}, size: {img_array.size}")
                        img_array = np.zeros((28, 28, 3), dtype=np.uint8)
        elif len(img_array.shape) == 2:
            # Grayscale 28x28, convert to RGB
            img_array = np.stack([img_array, img_array, img_array], axis=-1)
        elif len(img_array.shape) == 3 and img_array.shape[2] == 1:
            # Single channel, convert to RGB
            img_array = np.repeat(img_array, 3, axis=2)
        elif len(img_array.shape) == 3 and img_array.shape[2] == 3:
            # Already RGB 28x28x3
            pass
        else:
            # Try to reshape based on total size
            total_size = img_array.size
            if total_size == 28 * 28:
                # Grayscale 28x28
                img_array = img_array.reshape(28, 28)
                img_array = np.stack([img_array, img_array, img_array], axis=-1)
            elif total_size == 28 * 28 * 3:
                # RGB 28x28x3
                img_array = img_array.reshape(28, 28, 3)
            else:
                # Fallback: create a 28x28x3 image
                print(f"⚠️  Unexpected image shape: {img_array.shape}, size: {total_size}")
                img_array = np.zeros((28, 28, 3), dtype=np.uint8)
        
        # Ensure correct data type and range
        if img_array.dtype != np.uint8:
            if img_array.max() <= 1.0 and img_array.min() >= 0.0:
                img_array = (img_array * 255).astype(np.uint8)
            else:
                img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        
        # Convert to PIL Image
        img = Image.fromarray(img_array, mode='RGB')
        
        # Apply transforms
        transformed_img = transforms_pipeline(img)
        
        return {
            "image": transformed_img,
            "label": batch["label"]
        }
    
    dataset = dataset.with_transform(transform_batch)
    
    print(f"✅ Loaded {len(dataset)} samples")
    return dataset


def load_centralized_dataset(data_path: str):
    """Load centralized test dataset for evaluation"""
    return load_data(data_path, is_training=False)


def get_model(model_type: str, num_classes: int, pretrained: bool = False):
    """Get the specified model type for skin lesion classification"""
    print(f"🏗️  Building {model_type} model with {num_classes} classes")
    
    if model_type == "resnet18":
        return AdvancedResNet18(num_classes=num_classes, pretrained=pretrained)
    elif model_type == "efficientnet":
        return EfficientNetB0(num_classes=num_classes, pretrained=pretrained)
    elif model_type == "densenet121":
        return DenseNet121(num_classes=num_classes, pretrained=pretrained)
    elif model_type == "ensemble":
        # Create ensemble of multiple models
        models = [
            AdvancedResNet18(num_classes=num_classes, pretrained=pretrained),
            EfficientNetB0(num_classes=num_classes, pretrained=pretrained),
            DenseNet121(num_classes=num_classes, pretrained=pretrained)
        ]
        return EnsembleModel(models, num_classes=num_classes)
    else:
        # Default to ResNet18
        return AdvancedResNet18(num_classes=num_classes, pretrained=pretrained)


def get_model_config(model_type: str):
    """Get configuration for different model types"""
    configs = {
        "resnet18": {
            "use_focal_loss": True,
            "use_label_smoothing": False,
            "lr": 0.001,
            "weight_decay": 1e-4,
            "dropout_rate": 0.5,
            "description": "Advanced ResNet18 with transfer learning and custom head"
        },
        "efficientnet": {
            "use_focal_loss": True,
            "use_label_smoothing": True,
            "lr": 0.0005,
            "weight_decay": 1e-4,
            "dropout_rate": 0.3,
            "description": "EfficientNet-B0 with transfer learning and label smoothing"
        },
        "densenet121": {
            "use_focal_loss": True,
            "use_label_smoothing": False,
            "lr": 0.0008,
            "weight_decay": 1e-4,
            "dropout_rate": 0.4,
            "description": "DenseNet121 with transfer learning and custom head"
        },
        "ensemble": {
            "use_focal_loss": True,
            "use_label_smoothing": True,
            "lr": 0.0005,
            "weight_decay": 1e-4,
            "dropout_rate": 0.3,
            "description": "Ensemble of ResNet18, EfficientNet-B0, and DenseNet121"
        }
    }
    return configs.get(model_type, configs["resnet18"])


def train_advanced(net, trainloader, epochs, lr, device, use_focal_loss=True, 
                  use_label_smoothing=False, use_class_weights=True, 
                  weight_decay=1e-4, scheduler_type='cosine'):
    """Advanced training function with multiple optimization techniques"""
    
    net.to(device)
    net.train()
    
    # Setup loss function
    if use_focal_loss:
        criterion = FocalLoss(alpha=1, gamma=2).to(device)
    elif use_label_smoothing:
        criterion = LabelSmoothingLoss(num_classes=7, smoothing=0.1).to(device)
    else:
        criterion = nn.CrossEntropyLoss().to(device)
    
    # Setup optimizer with different learning rates for different parts
    if hasattr(net, 'backbone'):
        # Different learning rates for backbone and head
        backbone_params = []
        head_params = []
        
        for name, param in net.named_parameters():
            if 'backbone' in name and param.requires_grad:
                backbone_params.append(param)
            elif param.requires_grad:
                head_params.append(param)
        
        optimizer = torch.optim.AdamW([
            {'params': backbone_params, 'lr': lr * 0.1},  # Lower LR for pretrained backbone
            {'params': head_params, 'lr': lr}
        ], weight_decay=weight_decay)
    else:
        optimizer = torch.optim.AdamW(net.parameters(), lr=lr, weight_decay=weight_decay)
    
    # Setup learning rate scheduler
    if scheduler_type == 'cosine':
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    elif scheduler_type == 'plateau':
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
    else:
        scheduler = None
    
    # Training loop
    running_loss = 0.0
    best_loss = float('inf')
    patience_counter = 0
    patience = 5
    
    for epoch in range(epochs):
        epoch_loss = 0.0
        correct_predictions = 0
        total_predictions = 0
        
        for batch_idx, batch in enumerate(trainloader):
            if isinstance(batch, dict):
                images = batch["image"].to(device)
                # Ensure images have batch dimension
                if len(images.shape) == 3:
                    images = images.unsqueeze(0)  # Add batch dimension
                
                # Handle labels that might be integers or tensors
                if isinstance(batch["label"], int):
                    labels = torch.tensor(batch["label"]).to(device)
                else:
                    labels = batch["label"].to(device)
            else:
                images, labels = batch
                images = images.to(device)
                # Ensure images have batch dimension
                if len(images.shape) == 3:
                    images = images.unsqueeze(0)  # Add batch dimension
                
                # Handle labels that might be integers or tensors
                if isinstance(labels, int):
                    labels = torch.tensor(labels).to(device)
                else:
                    labels = labels.to(device)
            
            # Handle batch size 1 for batch normalization
            if images.shape[0] == 1:
                net.eval()  # Set to eval mode for batch size 1
            else:
                net.train()  # Set to train mode for larger batches
            
            optimizer.zero_grad()
            
            outputs = net(images)
            loss = criterion(outputs, labels)
            
            # Add L2 regularization
            l2_reg = torch.tensor(0.).to(device)
            for param in net.parameters():
                l2_reg += torch.norm(param)
            loss += weight_decay * l2_reg
            
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
            
            optimizer.step()
            
            epoch_loss += loss.item()
            
            # Track accuracy
            _, predicted = torch.max(outputs.data, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()
        
        avg_epoch_loss = epoch_loss / len(trainloader)
        epoch_accuracy = correct_predictions / total_predictions
        
        print(f"Epoch {epoch+1}/{epochs}: Loss = {avg_epoch_loss:.4f}, Accuracy = {epoch_accuracy:.4f}")
        
        # Update learning rate
        if scheduler:
            if scheduler_type == 'plateau':
                scheduler.step(avg_epoch_loss)
            else:
                scheduler.step()
        
        # Early stopping
        if avg_epoch_loss < best_loss:
            best_loss = avg_epoch_loss
            patience_counter = 0
        else:
            patience_counter += 1
            
        if patience_counter >= patience:
            print(f"🛑 Early stopping at epoch {epoch+1}")
            break
        
        running_loss += avg_epoch_loss
    
    print(f"✅ Training completed. Best loss: {best_loss:.4f}")
    return running_loss / (epoch + 1)


def test_advanced(net, testloader, device, class_names=None):
    """Advanced testing function with comprehensive evaluation"""
    
    net.to(device)
    net.eval()
    
    all_predictions = []
    all_labels = []
    all_probabilities = []
    
    with torch.no_grad():
        for batch in testloader:
            if isinstance(batch, dict):
                images = batch["image"].to(device)
                # Ensure images have batch dimension
                if len(images.shape) == 3:
                    images = images.unsqueeze(0)  # Add batch dimension
                
                # Handle labels that might be integers or tensors
                if isinstance(batch["label"], int):
                    labels = torch.tensor(batch["label"]).to(device)
                else:
                    labels = batch["label"].to(device)
            else:
                images, labels = batch
                images = images.to(device)
                # Ensure images have batch dimension
                if len(images.shape) == 3:
                    images = images.unsqueeze(0)  # Add batch dimension
                
                # Handle labels that might be integers or tensors
                if isinstance(labels, int):
                    labels = torch.tensor(labels).to(device)
                else:
                    labels = labels.to(device)
            
            outputs = net(images)
            probabilities = F.softmax(outputs, dim=1)
            _, predicted = torch.max(outputs, 1)
            
            all_predictions.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probabilities.extend(probabilities.cpu().numpy())
    
    # Calculate metrics
    accuracy = sum(p == l for p, l in zip(all_predictions, all_labels)) / len(all_labels)
    
    # Calculate loss - ensure arrays have the same length
    criterion = nn.CrossEntropyLoss()
    
    # Ensure all arrays have the same length
    min_length = min(len(all_probabilities), len(all_labels))
    if min_length > 0:
        all_probabilities = all_probabilities[:min_length]
        all_labels = all_labels[:min_length]
        
        # Convert probabilities to log probabilities for loss calculation
        log_probs = torch.log(torch.tensor(all_probabilities) + 1e-8)  # Add small epsilon to avoid log(0)
        loss = criterion(log_probs, torch.tensor(all_labels)).item()
    else:
        loss = 0.0
    
    # Detailed evaluation
    if class_names is None:
        class_names = [f"Class {i}" for i in range(7)]
    
    print(f"\n📊 ADVANCED EVALUATION RESULTS")
    print(f"🎯 Overall Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"📉 Loss: {loss:.4f}")
    
    # Classification report - handle variable number of classes
    unique_labels = sorted(list(set(all_labels + all_predictions)))
    available_class_names = [class_names[i] for i in unique_labels if i < len(class_names)]
    
    report = classification_report(all_labels, all_predictions, 
                                 labels=unique_labels,
                                 target_names=available_class_names, 
                                 zero_division=0)
    print(f"\n📈 Classification Report:\n{report}")
    
    # Confusion matrix
    cm = confusion_matrix(all_labels, all_predictions, labels=unique_labels)
    print(f"\n🔍 Confusion Matrix:")
    print(cm)
    
    # Confidence analysis
    max_probs = [max(probs) for probs in all_probabilities]
    avg_confidence = np.mean(max_probs)
    high_conf_threshold = 0.8
    high_conf_indices = [i for i, conf in enumerate(max_probs) if conf >= high_conf_threshold]
    
    if high_conf_indices:
        high_conf_accuracy = sum(all_predictions[i] == all_labels[i] for i in high_conf_indices) / len(high_conf_indices)
        print(f"\n🎲 Confidence Analysis:")
        print(f"  High Confidence (≥{high_conf_threshold}): {len(high_conf_indices)} samples, Accuracy: {high_conf_accuracy:.4f}")
        print(f"  Average Confidence: {avg_confidence:.4f}")
    else:
        high_conf_accuracy = 0.0
        print(f"\n🎲 Confidence Analysis:")
        print(f"  High Confidence (≥{high_conf_threshold}): 0 samples")
        print(f"  Average Confidence: {avg_confidence:.4f}")
    
    return {
        'accuracy': accuracy,
        'loss': loss,
        'avg_confidence': avg_confidence,
        'high_conf_accuracy': high_conf_accuracy,
        'predictions': all_predictions,
        'labels': all_labels,
        'probabilities': all_probabilities
    }


def maybe_init_wandb(use_wandb: bool, project_name: str = "skin-lesion-classification"):
    """Initialize Weights & Biases if enabled"""
    if use_wandb:
        try:
            wandb.init(project=project_name)
            print("✅ Weights & Biases initialized")
        except Exception as e:
            print(f"⚠️  Failed to initialize W&B: {e}")
            return False
    return True


def create_confusion_matrix_plot(results, model_name, run_number, accuracy, output_dir):
    """Create and save confusion matrix plot"""
    try:
        predictions = results['predictions']
        labels = results['labels']
        
        class_names = ["Melanocytic nevi", "Melanoma", "Benign keratosis", 
                      "Basal cell carcinoma", "Actinic keratoses", 
                      "Vascular lesions", "Dermatofibroma"]
        
        cm = confusion_matrix(labels, predictions)
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=class_names,
                   yticklabels=class_names,
                   cbar_kws={'label': 'Count'})
        
        plt.title(f'Confusion Matrix - {model_name}\nRun {run_number} | Accuracy: {accuracy:.2%}', 
                 fontsize=14, fontweight='bold')
        plt.xlabel('Predicted Label', fontsize=12)
        plt.ylabel('True Label', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        # Create filename
        filename = f"confusion_matrix_{model_name}_run{run_number}_acc{accuracy:.3f}.png"
        filepath = f"{output_dir}/{filename}"
        
        # Save the plot
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"📊 Confusion matrix saved: {filename}")
        return filepath
        
    except Exception as e:
        print(f"⚠️  Error creating confusion matrix: {e}")
        return None


def save_detailed_results(results, model_name, run_number, accuracy, output_dir):
    """Save detailed results to file"""
    try:
        filename = f"detailed_results_{model_name}_run{run_number}_acc{accuracy:.3f}.txt"
        filepath = f"{output_dir}/{filename}"
        
        with open(filepath, 'w') as f:
            f.write(f"Detailed Results - {model_name}\n")
            f.write(f"Run: {run_number}\n")
            f.write(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)\n")
            f.write(f"Loss: {results['loss']:.4f}\n")
            f.write(f"Average Confidence: {results['avg_confidence']:.4f}\n")
            f.write(f"High Confidence Accuracy: {results['high_conf_accuracy']:.4f}\n")
            
            f.write(f"\nClassification Report:\n")
            f.write(classification_report(results['labels'], results['predictions'], 
                                       target_names=["Melanocytic nevi", "Melanoma", "Benign keratosis", 
                                                   "Basal cell carcinoma", "Actinic keratoses", 
                                                   "Vascular lesions", "Dermatofibroma"],
                                       zero_division=0))
        
        print(f"📄 Detailed results saved: {filename}")
        return filepath
        
    except Exception as e:
        print(f"⚠️  Error saving detailed results: {e}")
        return None


# Original functions for backward compatibility
def train(net, trainloader, epochs, lr, device, use_focal_loss=True):
    """Original training function for backward compatibility"""
    return train_advanced(net, trainloader, epochs, lr, device, use_focal_loss=use_focal_loss)


def test(net, testloader, device):
    """Original test function for backward compatibility"""
    results = test_advanced(net, testloader, device)
    return results['accuracy'], results['loss']


# Legacy model classes for backward compatibility
class Net(nn.Module):
    """Original simple CNN for backward compatibility"""
    def __init__(self, num_classes=7):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.conv3 = nn.Conv2d(64, 128, 3)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(128 * 2 * 2, 128)
        self.fc2 = nn.Linear(128, num_classes)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(-1, 128 * 2 * 2)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x


# Legacy transform function
def get_skin_lesion_transforms(is_training=True):
    """Legacy transform function for backward compatibility"""
    return get_advanced_transforms(is_training=is_training)


# Legacy pytorch transforms
pytorch_transforms = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])
