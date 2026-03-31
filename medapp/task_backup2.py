"""medapp: A Flower / pytorch_msg_api app."""

import os
import numpy as np
from collections import defaultdict
import matplotlib.pyplot as plt
import seaborn as sns

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
import wandb
from datasets import load_from_disk
from torch.utils.data import DataLoader
from torchvision.transforms import (
    Compose, Normalize, ToTensor, RandomRotation, RandomHorizontalFlip, 
    RandomVerticalFlip, ColorJitter, RandomAffine, RandomResizedCrop,
    RandomErasing, RandomPerspective
)
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score


class AttentionBlock(nn.Module):
    """Channel attention mechanism for enhanced feature learning"""
    
    def __init__(self, in_channels, reduction=16):
        super(AttentionBlock, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        
        self.fc = nn.Sequential(
            nn.Linear(in_channels, in_channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(in_channels // reduction, in_channels, bias=False)
        )
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        b, c, h, w = x.size()
        
        # Global average pooling and max pooling
        avg_out = self.fc(self.avg_pool(x).view(b, c))
        max_out = self.fc(self.max_pool(x).view(b, c))
        
        # Combine and apply sigmoid
        out = avg_out + max_out
        attention = self.sigmoid(out).view(b, c, 1, 1)
        
        return x * attention


class EnhancedCNN(nn.Module):
    """Enhanced CNN with attention mechanisms optimized for skin lesion classification"""

    def __init__(self, num_classes: int):
        super(EnhancedCNN, self).__init__()
        
        # First convolutional block with attention
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.attention1 = AttentionBlock(32)
        self.pool1 = nn.MaxPool2d(2, 2)
        
        # Second convolutional block with attention
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.attention2 = AttentionBlock(64)
        self.pool2 = nn.MaxPool2d(2, 2)
        
        # Third convolutional block with attention
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.attention3 = AttentionBlock(128)
        self.pool3 = nn.MaxPool2d(2, 2)
        
        # Fourth convolutional block with attention
        self.conv4 = nn.Conv2d(128, 256, 3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        self.attention4 = AttentionBlock(256)
        self.pool4 = nn.MaxPool2d(2, 2)
        
        # Global average pooling
        self.global_avg_pool = nn.AdaptiveAvgPool2d(1)
        
        # Classifier with dropout
        self.dropout = nn.Dropout(0.5)
        self.fc1 = nn.Linear(256, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, num_classes)

    def forward(self, x):
        # First block
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.attention1(x)
        x = self.pool1(x)
        
        # Second block
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.attention2(x)
        x = self.pool2(x)
        
        # Third block
        x = F.relu(self.bn3(self.conv3(x)))
        x = self.attention3(x)
        x = self.pool3(x)
        
        # Fourth block
        x = F.relu(self.bn4(self.conv4(x)))
        x = self.attention4(x)
        x = self.pool4(x)
        
        # Global average pooling
        x = self.global_avg_pool(x)
        x = x.view(x.size(0), -1)
        
        # Classifier
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.dropout(F.relu(self.fc2(x)))
        x = self.fc3(x)
        
        return x


class ResNetBased(nn.Module):
    """ResNet-based model with transfer learning for skin lesion classification"""
    
    def __init__(self, num_classes: int):
        super(ResNetBased, self).__init__()
        # Use ResNet18 as backbone (no pretrained weights in Flower environment)
        self.backbone = torchvision.models.resnet18(pretrained=False)
        
        # Replace the final layer
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        
    def forward(self, x):
        return self.backbone(x)


class EfficientNetBased(nn.Module):
    """EfficientNet-based model optimized for medical imaging"""
    
    def __init__(self, num_classes: int):
        super(EfficientNetBased, self).__init__()
        # Use EfficientNet-B0 as backbone (no pretrained weights in Flower environment)
        self.backbone = torchvision.models.efficientnet_b0(pretrained=False)
        
        # Replace the classifier
        num_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(num_features, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.backbone(x)


# Keep the original Net class for backward compatibility
class Net(nn.Module):
    """Model (simple CNN adapted from 'PyTorch: A 60 Minute Blitz')"""

    def __init__(self, num_classes: int):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(3, 6, 5)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 13 * 13, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, num_classes)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(-1, 16 * 13 * 13)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)


class FocalLoss(nn.Module):
    """Focal Loss for addressing class imbalance in skin lesion classification"""
    
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


class ImprovedCNN(nn.Module):
    """Enhanced CNN with batch normalization, no dropout, and more layers"""
    
    def __init__(self, num_classes=7):
        super(ImprovedCNN, self).__init__()
        
        # Feature extraction layers with batch normalization
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)
        self.conv2 = nn.Conv2d(64, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool1 = nn.MaxPool2d(2, 2)
        
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.conv4 = nn.Conv2d(128, 128, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(128)
        self.pool2 = nn.MaxPool2d(2, 2)
        
        self.conv5 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn5 = nn.BatchNorm2d(256)
        self.conv6 = nn.Conv2d(256, 256, kernel_size=3, padding=1)
        self.bn6 = nn.BatchNorm2d(256)
        self.pool3 = nn.MaxPool2d(2, 2)
        
        # Additional layers for better feature learning
        self.conv7 = nn.Conv2d(256, 512, kernel_size=3, padding=1)
        self.bn7 = nn.BatchNorm2d(512)
        self.conv8 = nn.Conv2d(512, 512, kernel_size=3, padding=1)
        self.bn8 = nn.BatchNorm2d(512)
        
        # Global average pooling instead of flattening
        self.global_avg_pool = nn.AdaptiveAvgPool2d(1)
        
        # Classification head with batch normalization
        self.fc1 = nn.Linear(512, 256)
        self.bn_fc1 = nn.BatchNorm1d(256)
        self.fc2 = nn.Linear(256, 128)
        self.bn_fc2 = nn.BatchNorm1d(128)
        self.fc3 = nn.Linear(128, num_classes)
        
    def forward(self, x):
        # First block
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool1(x)
        
        # Second block
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.relu(self.bn4(self.conv4(x)))
        x = self.pool2(x)
        
        # Third block
        x = F.relu(self.bn5(self.conv5(x)))
        x = F.relu(self.bn6(self.conv6(x)))
        x = self.pool3(x)
        
        # Fourth block
        x = F.relu(self.bn7(self.conv7(x)))
        x = F.relu(self.bn8(self.conv8(x)))
        
        # Global average pooling
        x = self.global_avg_pool(x)
        x = x.view(x.size(0), -1)
        
        # Classification head
        x = F.relu(self.bn_fc1(self.fc1(x)))
        x = F.relu(self.bn_fc2(self.fc2(x)))
        x = self.fc3(x)
        
        return x


class HybridCNNSVM(nn.Module):
    """Hybrid CNN-SVM model: CNN for feature extraction, SVM for classification"""
    
    def __init__(self, num_classes=7):
        super(HybridCNNSVM, self).__init__()
        
        # CNN feature extractor
        self.feature_extractor = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Block 2
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Block 3
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1)
        )
        
        # Feature dimension for SVM
        self.feature_dim = 256
        self.num_classes = num_classes
        
        # SVM components (will be trained separately)
        self.svm_models = {}
        self.scaler = StandardScaler()
        self.svm_trained = False
        
    def extract_features(self, x):
        """Extract features using CNN"""
        features = self.feature_extractor(x)
        return features.view(features.size(0), -1)
    
    def forward(self, x):
        """Forward pass - use CNN features for now, SVM will be trained separately"""
        features = self.extract_features(x)
        
        # For now, use a simple linear layer instead of SVM
        # In practice, you'd train SVM separately and use it for inference
        if not hasattr(self, 'classifier'):
            self.classifier = nn.Linear(self.feature_dim, self.num_classes).to(x.device)
        
        return self.classifier(features)
    
    def train_svm(self, train_loader, device):
        """Train SVM on extracted features"""
        self.eval()
        features_list = []
        labels_list = []
        
        with torch.no_grad():
            for batch in train_loader:
                if isinstance(batch, (list, tuple)) and len(batch) == 2:
                    images, labels = batch
                else:
                    images = batch["image"]
                    labels = batch["label"]
                
                images = images.to(device)
                features = self.extract_features(images)
                features_list.append(features.cpu().numpy())
                labels_list.append(labels.numpy())
        
        # Combine all features and labels
        X = np.vstack(features_list)
        y = np.hstack(labels_list)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train SVM for each class (one-vs-rest)
        for class_id in range(self.num_classes):
            y_binary = (y == class_id).astype(int)
            if np.sum(y_binary) > 0:  # Only train if class has samples
                svm = SVC(kernel='rbf', probability=True, class_weight='balanced')
                svm.fit(X_scaled, y_binary)
                self.svm_models[class_id] = svm
        
        self.svm_trained = True
        print(f"✅ Trained SVM for {len(self.svm_models)} classes")


class DeepCNN(nn.Module):
    """Very deep CNN with residual connections and batch normalization"""
    
    def __init__(self, num_classes=7):
        super(DeepCNN, self).__init__()
        
        # Initial convolution
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3)
        self.bn1 = nn.BatchNorm2d(64)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        
        # Residual blocks
        self.layer1 = self._make_layer(64, 64, 2)
        self.layer2 = self._make_layer(64, 128, 2, stride=2)
        self.layer3 = self._make_layer(128, 256, 2, stride=2)
        self.layer4 = self._make_layer(256, 512, 2, stride=2)
        
        # Global average pooling
        self.avgpool = nn.AdaptiveAvgPool2d(1)
        
        # Classifier
        self.fc = nn.Linear(512, num_classes)
        
    def _make_layer(self, in_channels, out_channels, blocks, stride=1):
        layers = []
        
        # First block with potential downsampling
        layers.append(ResidualBlock(in_channels, out_channels, stride))
        
        # Remaining blocks
        for _ in range(1, blocks):
            layers.append(ResidualBlock(out_channels, out_channels))
            
        return nn.Sequential(*layers)
    
    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.maxpool(x)
        
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        
        return x


class ResidualBlock(nn.Module):
    """Residual block with batch normalization"""
    
    def __init__(self, in_channels, out_channels, stride=1):
        super(ResidualBlock, self).__init__()
        
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
        # Shortcut connection
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride),
                nn.BatchNorm2d(out_channels)
            )
    
    def forward(self, x):
        residual = x
        
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        
        out += self.shortcut(residual)
        out = F.relu(out)
        
        return out


# Enhanced data augmentation for skin lesion images
def get_skin_lesion_transforms(is_training=True):
    """No augmentation - preserve original medical image characteristics"""
    # No augmentation - preserve original medical image characteristics
    return Compose([
        ToTensor(),
        Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


# Original transforms for backward compatibility
pytorch_transforms = Compose([ToTensor(), Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])


def apply_transforms(batch):
    """Apply transforms to the partition from FederatedDataset."""
    batch["image"] = [pytorch_transforms(img) for img in batch["image"]]
    return batch


def load_data(data_path: str):
    """Load partition."""
    partition = load_from_disk(data_path)
    # Divide data on each node: 80% train, 20% test
    partition_train_test = partition.train_test_split(test_size=0.2, seed=42)
    # Construct dataloaders
    partition_train_test = partition_train_test.with_transform(apply_transforms)
    trainloader = DataLoader(partition_train_test["train"], batch_size=32, shuffle=True)
    testloader = DataLoader(partition_train_test["test"], batch_size=32)
    return trainloader, testloader


def train(net, trainloader, epochs, lr, device, use_focal_loss=False):
    """Train the model on the training set."""
    net.to(device)  # move model to GPU if available
    
    # Choose loss function based on model type
    if use_focal_loss:
        criterion = FocalLoss(alpha=1, gamma=2).to(device)
    else:
        criterion = torch.nn.CrossEntropyLoss().to(device)
    
    # Use different optimizers based on model type
    if isinstance(net, (ResNetBased, EfficientNetBased)):
        # For ResNet/EfficientNet architectures, use single learning rate since no pretrained weights
        optimizer = torch.optim.Adam(net.parameters(), lr=lr)
    else:
        optimizer = torch.optim.Adam(net.parameters(), lr=lr)
    
    net.train()
    running_loss = 0.0
    for _ in range(epochs):
        for batch in trainloader:
            images = batch["image"].to(device)
            labels = batch["label"].to(device)
            optimizer.zero_grad()
            loss = criterion(net(images), labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
    avg_trainloss = running_loss / len(trainloader)
    return avg_trainloss


def test(net, testloader, device):
    """Validate the model on the test set."""
    net.to(device)
    criterion = torch.nn.CrossEntropyLoss()
    correct, loss = 0, 0.0
    with torch.no_grad():
        for batch in testloader:
            images = batch["image"].to(device)
            labels = batch["label"].to(device)
            outputs = net(images)
            loss += criterion(outputs, labels).item()
            correct += (torch.max(outputs.data, 1)[1] == labels).sum().item()
    accuracy = correct / len(testloader.dataset)
    loss = loss / len(testloader)
    return loss, accuracy


def maybe_init_wandb(use_wandb: bool, wandbtoken: str) -> None:
    """Initialize Weights & Biases if specified in run_config."""
    if use_wandb:
        if not wandbtoken:
            print(
                "W&B token wasn't found. Set it by passing `--run-config=\"wandb-token='<YOUR-TOKEN>'\" to your `flwr run` command.",
            )
            use_wandb = False
        else:
            os.environ["WANDB_API_KEY"] = wandbtoken
            wandb.init(project="Flower-hackathon-MedApp")


def load_centralized_dataset(data_path: str):
    """Load test set and return dataloader."""
    # Load entire test set
    test_dataset = load_from_disk(data_path)
    dataset = test_dataset.with_format("torch").with_transform(apply_transforms)
    return DataLoader(dataset, batch_size=128)


def get_model(model_type: str, num_classes: int):
    """Get the specified model type for skin lesion classification"""
    if model_type == "enhanced_cnn":
        return EnhancedCNN(num_classes)
    elif model_type == "improved_cnn":
        return ImprovedCNN(num_classes)
    elif model_type == "hybrid_cnn_svm":
        return HybridCNNSVM(num_classes)
    elif model_type == "deep_cnn":
        return DeepCNN(num_classes)
    elif model_type == "resnet":
        return ResNetBased(num_classes)
    elif model_type == "efficientnet":
        return EfficientNetBased(num_classes)
    else:
        return Net(num_classes)  # Default to original Net


def get_model_config(model_type: str):
    """Get configuration for different model types"""
    configs = {
        "enhanced_cnn": {
            "use_focal_loss": True,
            "lr": 0.0005,  # Lower LR for better convergence with class balancing
            "description": "Enhanced CNN with attention and aggressive class balancing"
        },
        "improved_cnn": {
            "use_focal_loss": True,
            "lr": 0.001,  # Higher LR for improved CNN with batch norm
            "description": "Improved CNN with batch normalization, no dropout, more layers"
        },
        "hybrid_cnn_svm": {
            "use_focal_loss": False,  # SVM handles class imbalance
            "lr": 0.001,
            "description": "Hybrid CNN-SVM: CNN for features, SVM for classification"
        },
        "deep_cnn": {
            "use_focal_loss": True,
            "lr": 0.0005,  # Lower LR for deep network
            "description": "Deep CNN with residual connections and batch normalization"
        },
        "resnet": {
            "use_focal_loss": True,  # Enable focal loss for better minority class handling
            "lr": 0.0001,  # Lower LR for better convergence
            "description": "ResNet18 architecture with aggressive class balancing"
        },
        "efficientnet": {
            "use_focal_loss": True,
            "lr": 0.0001,  # Lower LR for better convergence
            "description": "EfficientNet-B0 architecture with aggressive class balancing"
        },
        "default": {
            "use_focal_loss": True,  # Enable focal loss by default
            "lr": 0.01,
            "description": "Original simple CNN"
        }
    }
    return configs.get(model_type, configs["default"])


def detailed_evaluation(net, testloader, device, class_names=None):
    """Comprehensive evaluation with confusion matrix and detailed metrics"""
    net.to(device)
    net.eval()
    
    all_predictions = []
    all_labels = []
    all_probabilities = []
    
    with torch.no_grad():
        for batch in testloader:
            images = batch["image"].to(device)
            labels = batch["label"].to(device)
            outputs = net(images)
            probabilities = F.softmax(outputs, dim=1)
            predictions = torch.argmax(outputs, dim=1)
            
            all_predictions.extend(predictions.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probabilities.extend(probabilities.cpu().numpy())
    
    # Convert to numpy arrays
    all_predictions = np.array(all_predictions)
    all_labels = np.array(all_labels)
    all_probabilities = np.array(all_probabilities)
    
    # Calculate metrics
    accuracy = (all_predictions == all_labels).mean()
    
    # Calculate loss
    criterion = torch.nn.CrossEntropyLoss()
    total_loss = 0.0
    with torch.no_grad():
        for batch in testloader:
            images = batch["image"].to(device)
            labels = batch["label"].to(device)
            outputs = net(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
    avg_loss = total_loss / len(testloader)
    
    # Simple confusion matrix calculation
    num_classes = len(np.unique(all_labels))
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for true_label, pred_label in zip(all_labels, all_predictions):
        cm[true_label, pred_label] += 1
    
    # Calculate per-class metrics
    precision = np.zeros(num_classes)
    recall = np.zeros(num_classes)
    f1 = np.zeros(num_classes)
    support = np.zeros(num_classes)
    
    for i in range(num_classes):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        tn = cm.sum() - tp - fp - fn
        
        precision[i] = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall[i] = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1[i] = 2 * (precision[i] * recall[i]) / (precision[i] + recall[i]) if (precision[i] + recall[i]) > 0 else 0
        support[i] = cm[i, :].sum()
    
    return {
        'accuracy': accuracy,
        'loss': avg_loss,
        'confusion_matrix': cm,
        'predictions': all_predictions,
        'labels': all_labels,
        'probabilities': all_probabilities,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'support': support,
        'class_names': class_names
    }


def analyze_class_imbalance(dataloader, class_names=None):
    """Analyze class distribution in the dataset"""
    class_counts = defaultdict(int)
    
    for batch in dataloader:
        labels = batch["label"].numpy()
        for label in labels:
            class_counts[label] += 1
    
    total_samples = sum(class_counts.values())
    class_distribution = {}
    
    for class_id, count in class_counts.items():
        percentage = (count / total_samples) * 100
        class_name = class_names[class_id] if class_names else f"Class_{class_id}"
        class_distribution[class_name] = {
            'count': count,
            'percentage': percentage
        }
    
    return class_distribution


def print_detailed_metrics(eval_results, model_name="Model"):
    """Print comprehensive evaluation metrics"""
    print(f"\n{'='*60}")
    print(f"📊 DETAILED EVALUATION: {model_name}")
    print(f"{'='*60}")
    
    # Overall accuracy
    print(f"🎯 Overall Accuracy: {eval_results['accuracy']:.4f} ({eval_results['accuracy']*100:.2f}%)")
    
    # Per-class metrics
    print(f"\n📈 Per-Class Metrics:")
    for i, class_name in enumerate(eval_results['class_names']):
        if i < len(eval_results['f1']):
            print(f"  {class_name}:")
            print(f"    Precision: {eval_results['precision'][i]:.4f}")
            print(f"    Recall:    {eval_results['recall'][i]:.4f}")
            print(f"    F1-Score:  {eval_results['f1'][i]:.4f}")
            print(f"    Support:   {int(eval_results['support'][i])}")
    
    # Confusion matrix
    print(f"\n🔍 Confusion Matrix:")
    cm = eval_results['confusion_matrix']
    print("     ", end="")
    for i in range(cm.shape[1]):
        print(f"Pred_{i:2d}", end="  ")
    print()
    
    for i in range(cm.shape[0]):
        print(f"True_{i:2d}", end="  ")
        for j in range(cm.shape[1]):
            print(f"{cm[i,j]:5d}", end="  ")
        print()
    
    # Identify problematic classes
    print(f"\n⚠️  Problematic Classes (F1 < 0.7):")
    for i, class_name in enumerate(eval_results['class_names']):
        if i < len(eval_results['f1']):
            f1_score = eval_results['f1'][i]
            if f1_score < 0.7:
                print(f"  {class_name}: F1={f1_score:.4f}, Recall={eval_results['recall'][i]:.4f}, Precision={eval_results['precision'][i]:.4f}")


def analyze_prediction_confidence(eval_results, confidence_threshold=0.8):
    """Analyze prediction confidence and identify uncertain predictions"""
    probabilities = eval_results['probabilities']
    max_probs = np.max(probabilities, axis=1)
    predictions = eval_results['predictions']
    labels = eval_results['labels']
    
    # High confidence predictions
    high_conf_mask = max_probs >= confidence_threshold
    high_conf_accuracy = (predictions[high_conf_mask] == labels[high_conf_mask]).mean() if np.any(high_conf_mask) else 0
    
    # Low confidence predictions
    low_conf_mask = max_probs < confidence_threshold
    low_conf_accuracy = (predictions[low_conf_mask] == labels[low_conf_mask]).mean() if np.any(low_conf_mask) else 0
    
    print(f"\n🎲 Prediction Confidence Analysis:")
    print(f"  High Confidence (≥{confidence_threshold}): {np.sum(high_conf_mask)} samples, Accuracy: {high_conf_accuracy:.4f}")
    print(f"  Low Confidence (<{confidence_threshold}): {np.sum(low_conf_mask)} samples, Accuracy: {low_conf_accuracy:.4f}")
    print(f"  Average Confidence: {np.mean(max_probs):.4f}")
    
    return {
        'high_conf_accuracy': high_conf_accuracy,
        'low_conf_accuracy': low_conf_accuracy,
        'avg_confidence': np.mean(max_probs),
        'high_conf_count': np.sum(high_conf_mask),
        'low_conf_count': np.sum(low_conf_mask)
    }


def enhanced_test(net, testloader, device, class_names=None, model_name="Model"):
    """Enhanced test function with comprehensive debugging"""
    # DermMNIST class names
    if class_names is None:
        class_names = [
            "Melanocytic nevi", "Melanoma", "Benign keratosis", 
            "Basal cell carcinoma", "Actinic keratoses", 
            "Vascular lesions", "Dermatofibroma"
        ]
    
    # Run detailed evaluation
    eval_results = detailed_evaluation(net, testloader, device, class_names)
    
    # Print comprehensive metrics
    print_detailed_metrics(eval_results, model_name)
    
    # Analyze prediction confidence
    confidence_analysis = analyze_prediction_confidence(eval_results)
    
    # Analyze class imbalance
    class_distribution = analyze_class_imbalance(testloader, class_names)
    print(f"\n📊 Class Distribution in Test Set:")
    for class_name, dist in class_distribution.items():
        print(f"  {class_name}: {dist['count']} samples ({dist['percentage']:.1f}%)")
    
    return eval_results, confidence_analysis, class_distribution


def train_with_class_balancing(net, trainloader, epochs, lr, device, use_focal_loss=True):
    """Train with aggressive class balancing for imbalanced dataset"""
    net.to(device)
    
    # Calculate class weights for imbalanced dataset
    class_counts = [0] * 7  # DermMNIST has 7 classes
    total_samples = 0
    
    for batch in trainloader:
        labels = batch["label"].numpy()
        for label in labels:
            class_counts[label] += 1
            total_samples += 1
    
    print(f"📊 Class distribution in training data:")
    class_names = ["Melanocytic nevi", "Melanoma", "Benign keratosis", 
                   "Basal cell carcinoma", "Actinic keratoses", 
                   "Vascular lesions", "Dermatofibroma"]
    
    for i, (name, count) in enumerate(zip(class_names, class_counts)):
        percentage = (count / total_samples) * 100
        print(f"  {name}: {count} samples ({percentage:.1f}%)")
    
    # Calculate aggressive class weights (square root of inverse frequency)
    class_weights = []
    max_count = max(class_counts)
    for count in class_counts:
        if count > 0:
            # Use square root to reduce extreme weights
            weight = np.sqrt(max_count / count)
            class_weights.append(weight)
        else:
            class_weights.append(1.0)
    
    print(f"📈 Class weights: {[f'{w:.2f}' for w in class_weights]}")
    class_weights = torch.FloatTensor(class_weights).to(device)
    
    # Use weighted loss with higher gamma for focal loss
    if use_focal_loss:
        criterion = FocalLoss(alpha=1, gamma=3).to(device)  # Higher gamma for more focus on hard examples
    else:
        criterion = torch.nn.CrossEntropyLoss(weight=class_weights).to(device)
    
    # Use different optimizers based on model type
    if isinstance(net, (ResNetBased, EfficientNetBased)):
        # For pretrained architectures, use lower learning rate
        optimizer = torch.optim.Adam(net.parameters(), lr=lr, weight_decay=1e-4)
    else:
        optimizer = torch.optim.Adam(net.parameters(), lr=lr, weight_decay=1e-4)
    
    # Learning rate scheduler
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
    
    net.train()
    running_loss = 0.0
    for epoch in range(epochs):
        epoch_loss = 0.0
        correct_predictions = 0
        total_predictions = 0
        
        for batch in trainloader:
            images = batch["image"].to(device)
            labels = batch["label"].to(device)
            optimizer.zero_grad()
            
            outputs = net(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping to prevent exploding gradients
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
        scheduler.step(avg_epoch_loss)
        
        running_loss += avg_epoch_loss
    
    return running_loss / epochs


def train_with_oversampling(net, trainloader, epochs, lr, device, use_focal_loss=True):
    """Train with oversampling of minority classes"""
    net.to(device)
    
    # Collect all data first
    all_images = []
    all_labels = []
    
    for batch in trainloader:
        all_images.append(batch["image"])
        all_labels.append(batch["label"])
    
    all_images = torch.cat(all_images, dim=0)
    all_labels = torch.cat(all_labels, dim=0)
    
    # Calculate class distribution
    class_counts = [0] * 7
    for label in all_labels:
        class_counts[label] += 1
    
    # Find max count for oversampling
    max_count = max(class_counts)
    
    # Oversample minority classes
    oversampled_images = []
    oversampled_labels = []
    
    for class_id in range(7):
        class_mask = all_labels == class_id
        class_images = all_images[class_mask]
        class_labels = all_labels[class_mask]
        
        # Add original samples
        oversampled_images.append(class_images)
        oversampled_labels.append(class_labels)
        
        # Oversample if this class has fewer samples
        if len(class_images) < max_count:
            # Calculate how many times to repeat
            repeat_factor = max_count // len(class_images)
            remainder = max_count % len(class_images)
            
            # Repeat the entire class
            if repeat_factor > 1:
                repeated_images = class_images.repeat(repeat_factor, 1, 1, 1)
                repeated_labels = class_labels.repeat(repeat_factor)
                oversampled_images.append(repeated_images)
                oversampled_labels.append(repeated_labels)
            
            # Add remainder samples
            if remainder > 0:
                remainder_indices = torch.randperm(len(class_images))[:remainder]
                oversampled_images.append(class_images[remainder_indices])
                oversampled_labels.append(class_labels[remainder_indices])
    
    # Combine all oversampled data
    balanced_images = torch.cat(oversampled_images, dim=0)
    balanced_labels = torch.cat(oversampled_labels, dim=0)
    
    # Create balanced dataset
    balanced_dataset = torch.utils.data.TensorDataset(balanced_images, balanced_labels)
    balanced_loader = torch.utils.data.DataLoader(balanced_dataset, batch_size=32, shuffle=True)
    
    print(f"📊 Balanced dataset size: {len(balanced_images)} samples")
    
    # Use focal loss for better handling of hard examples
    if use_focal_loss:
        criterion = FocalLoss(alpha=1, gamma=2).to(device)
    else:
        criterion = torch.nn.CrossEntropyLoss().to(device)
    
    optimizer = torch.optim.Adam(net.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
    
    net.train()
    running_loss = 0.0
    for epoch in range(epochs):
        epoch_loss = 0.0
        correct_predictions = 0
        total_predictions = 0
        
        for images, labels in balanced_loader:
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad()
            
            outputs = net(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
            
            optimizer.step()
            epoch_loss += loss.item()
            
            # Track accuracy
            _, predicted = torch.max(outputs.data, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()
        
        avg_epoch_loss = epoch_loss / len(balanced_loader)
        epoch_accuracy = correct_predictions / total_predictions
        
        print(f"Epoch {epoch+1}/{epochs}: Loss = {avg_epoch_loss:.4f}, Accuracy = {epoch_accuracy:.4f}")
        
        # Update learning rate
        scheduler.step(avg_epoch_loss)
        
        running_loss += avg_epoch_loss
    
    return running_loss / epochs


def train_with_simple_balancing(net, trainloader, epochs, lr, device, use_focal_loss=True):
    """Train with simple class balancing using weighted loss and basic oversampling"""
    net.to(device)
    
    # Collect all data first
    all_images = []
    all_labels = []
    
    for batch in trainloader:
        all_images.append(batch["image"])
        all_labels.append(batch["label"])
    
    all_images = torch.cat(all_images, dim=0)
    all_labels = torch.cat(all_labels, dim=0)
    
    # Calculate class distribution
    class_counts = [0] * 7
    for label in all_labels:
        class_counts[label] += 1
    
    print(f"📊 Original class distribution:")
    class_names = ["Melanocytic nevi", "Melanoma", "Benign keratosis", 
                   "Basal cell carcinoma", "Actinic keratoses", 
                   "Vascular lesions", "Dermatofibroma"]
    
    for i, (name, count) in enumerate(zip(class_names, class_counts)):
        percentage = (count / len(all_labels)) * 100
        print(f"  {name}: {count} samples ({percentage:.1f}%)")
    
    # Simple oversampling: repeat minority classes to balance dataset
    oversampled_images = []
    oversampled_labels = []
    
    # Find target count (use median instead of max to avoid extreme oversampling)
    non_zero_counts = [count for count in class_counts if count > 0]
    target_count = int(np.median(non_zero_counts)) if non_zero_counts else 100
    
    print(f"📈 Target samples per class: {target_count}")
    
    for class_id in range(7):
        class_mask = all_labels == class_id
        class_images = all_images[class_mask]
        class_labels = all_labels[class_mask]
        
        if len(class_images) == 0:
            continue  # Skip classes with no samples
        
        # Add original samples
        oversampled_images.append(class_images)
        oversampled_labels.append(class_labels)
        
        # Simple oversampling: repeat samples to reach target count
        if len(class_images) < target_count:
            # Calculate how many times to repeat
            repeat_times = target_count // len(class_images)
            remainder = target_count % len(class_images)
            
            # Repeat the entire class
            for _ in range(repeat_times):
                oversampled_images.append(class_images)
                oversampled_labels.append(class_labels)
            
            # Add remainder samples (random selection)
            if remainder > 0:
                remainder_indices = torch.randperm(len(class_images))[:remainder]
                oversampled_images.append(class_images[remainder_indices])
                oversampled_labels.append(class_labels[remainder_indices])
    
    # Combine all oversampled data
    if oversampled_images:
        balanced_images = torch.cat(oversampled_images, dim=0)
        balanced_labels = torch.cat(oversampled_labels, dim=0)
        
        # Create balanced dataset
        balanced_dataset = torch.utils.data.TensorDataset(balanced_images, balanced_labels)
        balanced_loader = torch.utils.data.DataLoader(balanced_dataset, batch_size=32, shuffle=True)
        
        print(f"📊 Balanced dataset size: {len(balanced_images)} samples")
    else:
        # Fallback to original data if no samples found
        print("⚠️  No samples found, using original data")
        balanced_loader = trainloader
    
    # Use focal loss for better handling of hard examples
    if use_focal_loss:
        criterion = FocalLoss(alpha=1, gamma=2).to(device)
    else:
        criterion = torch.nn.CrossEntropyLoss().to(device)
    
    optimizer = torch.optim.Adam(net.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
    
    net.train()
    running_loss = 0.0
    for epoch in range(epochs):
        epoch_loss = 0.0
        correct_predictions = 0
        total_predictions = 0
        
        for batch in balanced_loader:
            if isinstance(batch, (list, tuple)) and len(batch) == 2:
                # TensorDataset format
                images, labels = batch
            else:
                # Original dataloader format
                images = batch["image"]
                labels = batch["label"]
            
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad()
            
            outputs = net(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
            
            optimizer.step()
            epoch_loss += loss.item()
            
            # Track accuracy
            _, predicted = torch.max(outputs.data, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()
        
        avg_epoch_loss = epoch_loss / len(balanced_loader)
        epoch_accuracy = correct_predictions / total_predictions
        
        print(f"Epoch {epoch+1}/{epochs}: Loss = {avg_epoch_loss:.4f}, Accuracy = {epoch_accuracy:.4f}")
        
        # Update learning rate
        scheduler.step(avg_epoch_loss)
        
        running_loss += avg_epoch_loss
    
    return running_loss / epochs


def create_confusion_matrix_plot(eval_results, model_name, run_number, accuracy, output_dir):
    """Create and save confusion matrix visualization"""
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        
        # Set up the plot
        plt.figure(figsize=(12, 10))
        
        # Create confusion matrix heatmap
        cm = eval_results['confusion_matrix']
        class_names = eval_results['class_names']
        
        # Normalize confusion matrix for better visualization
        cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        
        # Create heatmap
        sns.heatmap(cm_normalized, 
                   annot=True, 
                   fmt='.2f', 
                   cmap='Blues',
                   xticklabels=class_names,
                   yticklabels=class_names,
                   cbar_kws={'label': 'Normalized Count'})
        
        plt.title(f'Confusion Matrix - {model_name}\nRun {run_number} | Accuracy: {accuracy:.2%}', 
                 fontsize=14, fontweight='bold')
        plt.xlabel('Predicted Label', fontsize=12)
        plt.ylabel('True Label', fontsize=12)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        # Create filename with model, run number, and accuracy
        filename = f"confusion_matrix_{model_name}_run{run_number}_acc{accuracy:.3f}.png"
        filepath = f"{output_dir}/{filename}"
        
        # Save the plot
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"📊 Confusion matrix saved: {filename}")
        return filepath
        
    except ImportError:
        print("⚠️  matplotlib/seaborn not available, skipping confusion matrix plot")
        return None
    except Exception as e:
        print(f"⚠️  Error creating confusion matrix: {e}")
        return None


def save_detailed_results(eval_results, confidence_analysis, class_distribution, 
                         model_name, run_number, accuracy, output_dir):
    """Save detailed results to file"""
    try:
        # Create filename with model, run number, and accuracy
        filename = f"detailed_results_{model_name}_run{run_number}_acc{accuracy:.3f}.txt"
        filepath = f"{output_dir}/{filename}"
        
        with open(filepath, 'w') as f:
            f.write(f"Detailed Results - {model_name} - Run {run_number}\n")
            f.write(f"Overall Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)\n")
            f.write("="*60 + "\n\n")
            
            # Per-class metrics
            f.write("Per-Class Metrics:\n")
            f.write("-" * 40 + "\n")
            for i, class_name in enumerate(eval_results['class_names']):
                if i < len(eval_results['f1']):
                    f.write(f"{class_name}:\n")
                    f.write(f"  Precision: {eval_results['precision'][i]:.4f}\n")
                    f.write(f"  Recall:    {eval_results['recall'][i]:.4f}\n")
                    f.write(f"  F1-Score:  {eval_results['f1'][i]:.4f}\n")
                    f.write(f"  Support:   {int(eval_results['support'][i])}\n\n")
            
            # Confusion matrix
            f.write("Confusion Matrix:\n")
            f.write("-" * 40 + "\n")
            cm = eval_results['confusion_matrix']
            f.write("     ")
            for i in range(cm.shape[1]):
                f.write(f"Pred_{i:2d}  ")
            f.write("\n")
            
            for i in range(cm.shape[0]):
                f.write(f"True_{i:2d}  ")
                for j in range(cm.shape[1]):
                    f.write(f"{cm[i,j]:5d}  ")
                f.write("\n")
            
            # Confidence analysis
            f.write(f"\nPrediction Confidence Analysis:\n")
            f.write("-" * 40 + "\n")
            f.write(f"Average Confidence: {confidence_analysis['avg_confidence']:.4f}\n")
            f.write(f"High Confidence Accuracy: {confidence_analysis['high_conf_accuracy']:.4f}\n")
            f.write(f"Low Confidence Accuracy: {confidence_analysis['low_conf_accuracy']:.4f}\n")
            f.write(f"High Confidence Count: {confidence_analysis['high_conf_count']}\n")
            f.write(f"Low Confidence Count: {confidence_analysis['low_conf_count']}\n")
            
            # Class distribution
            f.write(f"\nClass Distribution:\n")
            f.write("-" * 40 + "\n")
            for class_name, dist in class_distribution.items():
                f.write(f"{class_name}: {dist['count']} samples ({dist['percentage']:.1f}%)\n")
        
        print(f"📄 Detailed results saved: {filename}")
        return filepath
        
    except Exception as e:
        print(f"⚠️  Error saving detailed results: {e}")
        return None


class EarlyStopping:
    """Early stopping utility to prevent overfitting"""
    
    def __init__(self, patience=5, min_delta=0.001, restore_best_weights=True):
        self.patience = patience
        self.min_delta = min_delta
        self.restore_best_weights = restore_best_weights
        self.best_loss = None
        self.counter = 0
        self.best_weights = None
        
    def __call__(self, val_loss, model):
        if self.best_loss is None:
            self.best_loss = val_loss
            self.save_checkpoint(model)
        elif val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
            self.save_checkpoint(model)
        else:
            self.counter += 1
            
        if self.counter >= self.patience:
            if self.restore_best_weights:
                model.load_state_dict(self.best_weights)
            return True
        return False
    
    def save_checkpoint(self, model):
        """Save the best model weights"""
        self.best_weights = model.state_dict().copy()


def train_with_early_stopping(net, trainloader, epochs, lr, device, use_focal_loss=True, 
                             optimizer_type='adam', patience=5):
    """Train with early stopping and different optimizers"""
    net.to(device)
    
    # Collect all data first for class balancing
    all_images = []
    all_labels = []
    
    for batch in trainloader:
        all_images.append(batch["image"])
        all_labels.append(batch["label"])
    
    all_images = torch.cat(all_images, dim=0)
    all_labels = torch.cat(all_labels, dim=0)
    
    # Calculate class distribution
    class_counts = [0] * 7
    for label in all_labels:
        class_counts[label] += 1
    
    print(f"📊 Original class distribution:")
    class_names = ["Melanocytic nevi", "Melanoma", "Benign keratosis", 
                   "Basal cell carcinoma", "Actinic keratoses", 
                   "Vascular lesions", "Dermatofibroma"]
    
    for i, (name, count) in enumerate(zip(class_names, class_counts)):
        percentage = (count / len(all_labels)) * 100
        print(f"  {name}: {count} samples ({percentage:.1f}%)")
    
    # Simple oversampling: repeat minority classes to balance dataset
    oversampled_images = []
    oversampled_labels = []
    
    # Find target count (use median instead of max to avoid extreme oversampling)
    non_zero_counts = [count for count in class_counts if count > 0]
    target_count = int(np.median(non_zero_counts)) if non_zero_counts else 100
    
    print(f"📈 Target samples per class: {target_count}")
    
    for class_id in range(7):
        class_mask = all_labels == class_id
        class_images = all_images[class_mask]
        class_labels = all_labels[class_mask]
        
        if len(class_images) == 0:
            continue  # Skip classes with no samples
        
        # Add original samples
        oversampled_images.append(class_images)
        oversampled_labels.append(class_labels)
        
        # Simple oversampling: repeat samples to reach target count
        if len(class_images) < target_count:
            # Calculate how many times to repeat
            repeat_times = target_count // len(class_images)
            remainder = target_count % len(class_images)
            
            # Repeat the entire class
            for _ in range(repeat_times):
                oversampled_images.append(class_images)
                oversampled_labels.append(class_labels)
            
            # Add remainder samples (random selection)
            if remainder > 0:
                remainder_indices = torch.randperm(len(class_images))[:remainder]
                oversampled_images.append(class_images[remainder_indices])
                oversampled_labels.append(class_labels[remainder_indices])
    
    # Combine all oversampled data
    if oversampled_images:
        balanced_images = torch.cat(oversampled_images, dim=0)
        balanced_labels = torch.cat(oversampled_labels, dim=0)
        
        # Create balanced dataset
        balanced_dataset = torch.utils.data.TensorDataset(balanced_images, balanced_labels)
        balanced_loader = torch.utils.data.DataLoader(balanced_dataset, batch_size=32, shuffle=True)
        
        print(f"📊 Balanced dataset size: {len(balanced_images)} samples")
    else:
        # Fallback to original data if no samples found
        print("⚠️  No samples found, using original data")
        balanced_loader = trainloader
    
    # Use focal loss for better handling of hard examples
    if use_focal_loss:
        criterion = FocalLoss(alpha=1, gamma=2).to(device)
    else:
        criterion = torch.nn.CrossEntropyLoss().to(device)
    
    # Different optimizers
    if optimizer_type.lower() == 'adamw':
        optimizer = torch.optim.AdamW(net.parameters(), lr=lr, weight_decay=1e-4)
    elif optimizer_type.lower() == 'sgd':
        optimizer = torch.optim.SGD(net.parameters(), lr=lr, momentum=0.9, weight_decay=1e-4)
    elif optimizer_type.lower() == 'rmsprop':
        optimizer = torch.optim.RMSprop(net.parameters(), lr=lr, weight_decay=1e-4)
    else:  # Default to Adam
        optimizer = torch.optim.Adam(net.parameters(), lr=lr, weight_decay=1e-4)
    
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
    early_stopping = EarlyStopping(patience=patience)
    
    net.train()
    running_loss = 0.0
    best_loss = float('inf')
    
    for epoch in range(epochs):
        epoch_loss = 0.0
        correct_predictions = 0
        total_predictions = 0
        
        for batch in balanced_loader:
            if isinstance(batch, (list, tuple)) and len(batch) == 2:
                # TensorDataset format
                images, labels = batch
            else:
                # Original dataloader format
                images = batch["image"]
                labels = batch["label"]
            
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad()
            
            outputs = net(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
            
            optimizer.step()
            epoch_loss += loss.item()
            
            # Track accuracy
            _, predicted = torch.max(outputs.data, 1)
            total_predictions += labels.size(0)
            correct_predictions += (predicted == labels).sum().item()
        
        avg_epoch_loss = epoch_loss / len(balanced_loader)
        epoch_accuracy = correct_predictions / total_predictions
        
        print(f"Epoch {epoch+1}/{epochs}: Loss = {avg_epoch_loss:.4f}, Accuracy = {epoch_accuracy:.4f}")
        
        # Update learning rate
        scheduler.step(avg_epoch_loss)
        
        # Early stopping check
        if early_stopping(avg_epoch_loss, net):
            print(f"🛑 Early stopping at epoch {epoch+1}")
            break
        
        running_loss += avg_epoch_loss
        best_loss = min(best_loss, avg_epoch_loss)
    
    print(f"✅ Training completed. Best loss: {best_loss:.4f}")
    return running_loss / (epoch + 1)


def train_hybrid_model(net, trainloader, epochs, lr, device):
    """Train hybrid CNN-SVM model"""
    net.to(device)
    
    # First train CNN feature extractor
    print("🔧 Training CNN feature extractor...")
    train_with_early_stopping(net, trainloader, epochs//2, lr, device, 
                             use_focal_loss=False, optimizer_type='adam')
    
    # Then train SVM on extracted features
    print("🔧 Training SVM classifier...")
    net.train_svm(trainloader, device)
    
    return 0.0  # Return dummy loss since SVM training is separate
