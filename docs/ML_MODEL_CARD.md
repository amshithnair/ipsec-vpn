# ML Model Card: Traffic Type Inference

## 1. Model Details
- **Name**: Traffic Type Inference RF
- **Version**: 1.0.0
- **Type**: Random Forest Classifier (`scikit-learn`)
- **Purpose**: Augment the deterministic protocol parser by inferring the likely traffic type encapsulated inside IPsec tunnels (or identifying unencrypted traffic) using network flow statistics.

## 2. Intended Use
- **Primary Use Case**: Predicting traffic application categories (VoIP, HTTP, Video, ICMP) based purely on packet-level flow statistics (timing, size, ratios) without deep packet inspection.
- **Integration**: Used in the IPSEC-VPN Python AI service as a secondary analysis layer when deterministic classification does not apply.

## 3. Training Data
- **Dataset**: Synthetic IP flow statistics mimicking realistic protocol distributions.
- **Size**: 12,000 samples (2,000 per class).
- **Class Balance**: Perfectly balanced across 6 classes (`HTTP`, `ICMP`, `VPN`, `Video`, `VoIP`, `Unknown`).
- **Generation Methodology**: Gaussian distributions parameterized by typical application profiles (e.g. VoIP = constant low variance bitrate, high UDP ratio).

## 4. Input Features
The model requires the following 9 features extracted from PCAP flows:
- `total_packets` (int)
- `total_bytes` (int)
- `duration_seconds` (float)
- `bytes_per_second` (float)
- `packets_per_second` (float)
- `avg_packet_size` (float)
- `packet_size_variance` (float)
- `udp_ratio` (float)
- `tcp_ratio` (float)

## 5. Evaluation Metrics
*Evaluated on a 30% hold-out test set.*
- **Accuracy**: 0.9997 (99.97%)
- **F1 Score (Macro)**: 0.9997

**Classification Report**:
```
              precision    recall  f1-score   support
        HTTP       1.00      1.00      1.00       595
        ICMP       1.00      1.00      1.00       621
     Unknown       1.00      1.00      1.00       593
         VPN       1.00      1.00      1.00       639
       Video       1.00      1.00      1.00       562
        VoIP       1.00      1.00      1.00       590
```

## 6. Limitations & Fallback Behavior
- **Out-of-Distribution limitations**: Because the model is trained on synthetic statistical data, it may struggle with highly anomalous zero-day traffic profiles or exotic encapsulation methods.
- **Fallback Behavior**: The pipeline restricts ML invocation strictly to cases where the deterministic parser cannot identify a definitive protocol, or explicitly when augmenting the base result with a traffic-type inference.
- **Confidence Interpretation**: The Random Forest's `.predict_proba()` is used for `model_confidence`. If the highest class probability is `< 0.60`, the output falls back to `Unknown`.
