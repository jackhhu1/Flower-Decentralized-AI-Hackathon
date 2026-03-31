# DermaCheck — Decentralized AI for Skin Cancer Detection

A federated learning system for skin lesion classification across distributed hospital nodes, built for the [Flower Decentralized AI Hackathon (Stanford 2025)](https://flower.ai/blog/2025-09-24-hackathon-sf/). Patient data never leaves the hospital — only model weights are shared.

---

## Overview

DermaCheck combines three components:

| Component | Description |
|---|---|
| **Federated Learning** | Flower-based training across 8 simulated hospital partitions on the ResearchGrid |
| **ML Inference Service** | Local Flask REST API serving the trained model |
| **Mobile App** | Expo/React Native app for capturing and analysing skin images |

**Skin lesion classes (DermaMNIST, 7 classes)**:
- Melanoma (MEL) — malignant
- Basal Cell Carcinoma (BCC) — malignant
- Actinic Keratosis (AKIEC) — pre-malignant
- Benign Keratosis (BKL), Dermatofibroma (DF), Vascular Lesions (VASC), Melanocytic Nevi (NV) — benign

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FEDERATED LEARNING                          │
│                                                                 │
│  Hospital A ──┐                                                 │
│  Hospital B ──┤                                                 │
│  Hospital C ──┤──▶ Flower ResearchGrid ──▶ FedAvg Server ──▶  │
│  Hospital D ──┤         (remote)           (aggregation)       │
│  Hospital E ──┤                                    │            │
│  Hospital F ──┤                                    ▼            │
│  Hospital G ──┤                             Trained Model       │
│  Hospital H ──┘                                    │            │
└────────────────────────────────────────────────────┼────────────┘
                                                     │ flwr pull
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOCAL INFERENCE                            │
│                                                                 │
│   ML Service (Flask :5000)                                      │
│   POST /analyze ◀──── Expo Mobile App                          │
│        │               (Camera → 28×28 base64)                 │
│        ▼                                                        │
│   EnhancedCNN ──▶ 7-class softmax ──▶ Cancer risk score        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Model Architecture

The primary model is **EnhancedCNN**, a custom 5-block convolutional network with attention and residual connections, optimised for medical image classification.

```
Input (3×28×28)
    │
    ▼
Conv Block 1 (64 ch)  ──▶ Channel Attention ──▶ + Residual
Conv Block 2 (128 ch) ──▶ Channel Attention ──▶ + Residual
Conv Block 3 (256 ch) ──▶ Channel Attention ──▶ + Residual
Conv Block 4 (512 ch) ──▶ Channel Attention ──▶ + Residual
Conv Block 5 (512 ch) ──▶ Channel Attention ──▶ + Residual
    │
    ▼
Multi-scale Pooling (GlobalAvgPool + GlobalMaxPool → concat)
    │
    ▼
Dense: 1024 → 512 → 256 → 7 (dropout 0.3–0.5)
    │
    ▼
Output (7 classes)
```

Alternative architectures available: `resnet` (ResNet18 transfer learning) and `efficientnet` (EfficientNet-B0).

### Loss Functions

**FocalLoss** — handles class imbalance by down-weighting easy examples:
- γ = 3, per-class weights `[1.0, 3.0, 2.0, 2.5, 2.0, 1.0, 1.0]` (higher weight on malignant classes)

**DiagnosticLoss** — adds a confidence penalty for cancer classes:
- Penalises predictions with <80% confidence for high-risk classes

### Training Configuration

| Parameter | Value |
|---|---|
| Optimiser | AdamW, weight decay 1e-4 |
| Learning rate | 0.001 (EnhancedCNN), 0.0005 (ResNet/EfficientNet) |
| Scheduler | CosineAnnealingWarmRestarts (T₀=10, Tmult=2) |
| Gradient clipping | max_norm = 1.0 |
| Batch size | 32 |
| Local epochs | 3 |
| FL rounds | 10 |

---

## Federated Learning Setup

### Quick Start

```shell
# Install Flower
pip install flwr

# Optionally install project dependencies
pip install -e .
```

> **Note:** All commands should be run from the project root directory.
> For Track 1, only `flwr` needs to be installed locally — your code runs on the ResearchGrid.

### Login

```shell
flwr login
```

Click the login link, enter credentials, and confirm. You should see `✅ Login successful.`

### Run Training

```shell
# Default run (dermamnist, 7 classes)
flwr run --stream

# Different dataset
flwr run --stream --run-config="dataset='organamnist' num-classes=11"

# With Weights & Biases logging
flwr run --stream --run-config="use-wandb=true wandb-token='<your-token>'"
```

Expected output:
```
Loading project configuration...
Success
🎊 Successfully started run 2081565958753492077
INFO :      Starting logstream for run_id `2081565958753492077`
...
```

### Manage Runs

```shell
# List all runs
flwr ls

# Pull artifacts (model checkpoints, logs)
flwr pull --run-id <your-run-id>

# Stop a run
flwr stop <your-run-id>
```

Artifacts are saved to `context.node_config["output_dir"]` and bundled as a zip file for download.

### Available Datasets

| Dataset | Samples | Classes |
|---|---|---|
| dermamnist | 10,015 | 7 |
| pathmnist | 107,180 | 9 |
| organamnist | 58,850 | 11 |
| bloodmnist | 17,092 | 8 |
| retinamnist | 1,600 | 5 |

Each dataset is partitioned into 8 splits representing 8 hospital nodes. See `save_datasets.ipynb` for previewing partitions (requires `pip install jupyter matplotlib`).

---

## ML Inference Service

A local Flask service that loads the trained model and serves predictions over HTTP.

### Start

```shell
./start_ml_service.sh
# or manually:
pip install flask flask-cors pillow torch torchvision
python ml_service.py
# Runs on http://localhost:5000
```

### Endpoints

**`GET /health`**
```json
{ "status": "ok", "model_loaded": true, "device": "cpu" }
```

**`POST /analyze`**

Request:
```json
{ "image": "<base64-encoded image string>" }
```

Response:
```json
{
  "predictions": [
    {
      "className": "Melanoma",
      "probability": 0.82,
      "confidence": "HIGH",
      "cancerRisk": "HIGH",
      "malignancyType": "Malignant",
      "clinicalUrgency": "Immediate",
      "cancerRiskScore": 91
    }
  ]
}
```

**`GET /model/info`** — model type, class names, version, accuracy

**`GET /fl/statistics`** — total rounds, active clients, last update

### How Inference Works

1. Decode base64 → PIL Image → RGB
2. Resize to 28×28 (DermaMNIST standard)
3. Apply ImageNet normalisation (mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]`)
4. Forward pass through EnhancedCNN → softmax probabilities
5. Map to cancer risk context (malignancy type, urgency, risk score 0–100)

---

## Mobile App

An Expo/React Native app for capturing skin images and displaying results with medical context.

### Start

```shell
./start_app.sh
# or manually:
cd expo-app
npm install
npm start
# Scan QR code with Expo Go, or press 'a' (Android) / 'i' (iOS simulator)
```

### Screens

| Screen | Description |
|---|---|
| **Home** | Quick action cards, analysis progress overview, medical disclaimer |
| **Camera** | Live camera preview, photo library picker, image capture |
| **Results** | Per-class prediction bars, cancer risk score, confidence visualisation |
| **Analysis Review** | Detailed breakdown, comparison tools, feedback submission |
| **Dermatologist Mode** | Professional interface with advanced metrics and referral workflows |
| **History** | Past analyses with search and comparison |
| **Education** | Skin cancer types, risk factors, prevention guidance |
| **Settings** | API endpoint config, model info, offline mode |

### Analysis Flow

```
Camera capture / photo picker
        │
        ▼
imageProcessor.js
  └─ resize to 28×28
  └─ JPEG quality 80
  └─ base64 encode
        │
        ▼
apiService.analyzeSkinImage()
  └─ POST http://localhost:5000/analyze
        │
        ▼
Results screen
  └─ risk score visualisation
  └─ per-class probability bars
  └─ cancer urgency classification
  └─ save to local history / forward to dermatologist
```

### Design

- Dark theme: navy background (`#0F0F23`), teal accent (`#00D4AA`)
- Status colours: green (benign), orange (pre-malignant), red (malignant)
- Offline-capable: analyses cached with Async Storage

---

## Project Structure

```
├── medapp/
│   ├── client_app.py       # Flower client: local training and evaluation
│   ├── server_app.py       # Flower server: FedAvg aggregation, global eval
│   └── task.py             # Model definitions, training, data loading
├── ml_service.py           # Flask inference API
├── expo-app/
│   ├── App.js              # Navigation setup, entry point
│   ├── src/
│   │   ├── screens/        # All 8 app screens
│   │   ├── services/
│   │   │   └── apiService.js   # Axios client for ML service
│   │   ├── utils/
│   │   │   ├── imageProcessor.js   # 28×28 resize + base64 encoding
│   │   │   └── storage.js          # Async Storage for history
│   │   └── theme/theme.js
│   └── assets/             # Bundled model files
├── pyproject.toml          # Flower app config and FL hyperparameters
├── ml_service_requirements.txt
├── start_app.sh
├── start_ml_service.sh
└── save_datasets.ipynb     # Dataset preview notebook
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Federated Learning | Flower `>=1.22`, Flower Datasets |
| Deep Learning | PyTorch 2.8, TorchVision 0.23 |
| Inference API | Flask 2.3, Flask-CORS, Pillow |
| Mobile | React Native 0.81, Expo 54, React Navigation |
| HTTP Client | Axios 1.6 |
| Experiment Tracking | Weights & Biases (optional) |

---

## Remote Environment Dependencies

<details>
<summary>Full dependency list (ResearchGrid)</summary>

```
torch                     2.8.0+cpu
torchvision               0.23.0+cpu
flwr                      1.23.0
flwr-datasets             0.5.0
numpy                     2.3.3
pandas                    2.2.3
scikit-learn              1.6.1
matplotlib                3.10.6
seaborn                   0.13.2
wandb                     0.21.0
jax                       0.5.3
jaxlib                    0.5.3
transformers              4.51.1
datasets                  3.1.0
huggingface-hub           0.35.1
ray                       2.31.0
pillow                    11.0.0
scipy                     1.16.2
(+ 230 further packages)
```

</details>

---

## Resources

- [Flower Docs](https://flower.ai/docs/)
- [Flower Datasets](https://flower.ai/docs/datasets/)
- [Hackathon Guide](https://discuss.flower.ai/t/decentralized-ai-hackathon-stanford-2025/1109)
- [MedMNIST](https://medmnist.com/)
- [flwr run CLI reference](https://flower.ai/docs/framework/ref-api-cli.html#flwr-run)
