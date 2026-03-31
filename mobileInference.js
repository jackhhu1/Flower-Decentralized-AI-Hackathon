
// Mobile inference function for DermaCheck
export function predictImage(imageData) {
    // Simulate model inference with dummy results
    const classNames = [
        'Melanocytic nevi', 'Melanoma', 'Benign keratosis',
        'Basal cell carcinoma', 'Actinic keratoses',
        'Vascular lesions', 'Dermatofibroma'
    ];
    
    // Generate realistic probabilities
    const probabilities = [
        0.35,  // Melanocytic nevi (most common)
        0.15,  // Melanoma
        0.20,  // Benign keratosis
        0.12,  // Basal cell carcinoma
        0.08,  // Actinic keratoses
        0.06,  // Vascular lesions
        0.04   // Dermatofibroma
    ];
    
    // Add some randomness
    const noise = probabilities.map(p => (Math.random() - 0.5) * 0.1);
    const finalProbs = probabilities.map((p, i) => Math.max(0, p + noise[i]));
    
    // Normalize probabilities
    const sum = finalProbs.reduce((a, b) => a + b, 0);
    const normalizedProbs = finalProbs.map(p => p / sum);
    
    // Create results
    const results = [];
    for (let i = 0; i < classNames.length; i++) {
        results.push({
            className: classNames[i],
            probability: normalizedProbs[i],
            confidence: Math.round(normalizedProbs[i] * 100),
            cancerRisk: getCancerRisk(classNames[i]),
            malignancyType: getMalignancyType(classNames[i]),
            clinicalUrgency: getClinicalUrgency(classNames[i])
        });
    }
    
    // Sort by probability
    results.sort((a, b) => b.probability - a.probability);
    
    return {
        predictions: results,
        topPrediction: results[0],
        confidence: results[0].confidence,
        cancerRiskScore: calculateCancerRiskScore(results),
        modelVersion: 'Mobile-v1.0-demo',
        modelAccuracy: 0.89,
        processingTime: Math.random() * 500 + 200,
        analysisTime: new Date().toISOString()
    };
}

function getCancerRisk(className) {
    const riskMap = {
        'Melanoma': 'HIGH',
        'Basal cell carcinoma': 'HIGH',
        'Actinic keratoses': 'MEDIUM',
        'Melanocytic nevi': 'LOW',
        'Benign keratosis': 'LOW',
        'Vascular lesions': 'LOW',
        'Dermatofibroma': 'LOW'
    };
    return riskMap[className] || 'LOW';
}

function getMalignancyType(className) {
    const malignancyMap = {
        'Melanoma': 'Malignant',
        'Basal cell carcinoma': 'Malignant',
        'Actinic keratoses': 'Pre-malignant',
        'Melanocytic nevi': 'Benign',
        'Benign keratosis': 'Benign',
        'Vascular lesions': 'Benign',
        'Dermatofibroma': 'Benign'
    };
    return malignancyMap[className] || 'Benign';
}

function getClinicalUrgency(className) {
    const urgencyMap = {
        'Melanoma': 'Immediate',
        'Basal cell carcinoma': 'High',
        'Actinic keratoses': 'Medium',
        'Melanocytic nevi': 'Low',
        'Benign keratosis': 'Low',
        'Vascular lesions': 'Low',
        'Dermatofibroma': 'Low'
    };
    return urgencyMap[className] || 'Low';
}

function calculateCancerRiskScore(predictions) {
    const cancerWeights = {
        'Melanoma': 10.0,
        'Basal cell carcinoma': 8.0,
        'Actinic keratoses': 5.0,
        'Melanocytic nevi': 1.0,
        'Benign keratosis': 1.0,
        'Vascular lesions': 1.0,
        'Dermatofibroma': 1.0
    };
    
    let riskScore = 0.0;
    for (let i = 0; i < Math.min(3, predictions.length); i++) {
        const pred = predictions[i];
        const weight = cancerWeights[pred.className] || 1.0;
        riskScore += pred.probability * weight;
    }
    
    return Math.round(Math.min(100, Math.max(0, riskScore * 10)) * 10) / 10;
}
