# ML Dataset Strategy & Plan

## Objective
Train a lightweight, high-performance, local classical ML model (Random Forest) for **Traffic Type Inference** using features extracted directly from network PCAPs, without relying on deep packet inspection (DPI) of encrypted payloads.

## Target Labels
The model will classify network flows into the following target categories:
- `VoIP` (e.g., SIP, RTP streams)
- `HTTP` (Web browsing)
- `VPN` (IPsec, OpenVPN tunnels)
- `ICMP` (Ping, network diagnostics)
- `Video` (Streaming)
- `Unknown` (When model confidence is below a defined threshold)

## Feature Schema
The feature extraction pipeline will rely on the `scapy` parser to compute statistical metrics for each IP/TCP/UDP flow inside the PCAP. We cannot inspect encrypted payloads, so the features are strictly flow-level and packet-level metadata:

1. **`total_packets`**: Total number of packets in the capture.
2. **`total_bytes`**: Total volume of data transferred.
3. **`duration_seconds`**: Time difference between first and last packet.
4. **`bytes_per_second`**: Average throughput.
5. **`packets_per_second`**: Average packet rate.
6. **`avg_packet_size`**: Mean packet size (bytes).
7. **`packet_size_variance`**: Variance in packet sizes (helps distinguish constant-bitrate VoIP from bursty HTTP).
8. **`udp_ratio`**: Percentage of packets using UDP (high for Video/VoIP/VPN).
9. **`tcp_ratio`**: Percentage of packets using TCP (high for HTTP).

## Data Sources & Collection Methodology
Given the difficulty of obtaining real-world, labeled, privacy-compliant enterprise PCAPs, we will generate a **synthetic dataset**. 

A script (`scripts/train_model.py`) will programmatically generate a dataset (`dataset.csv`) by simulating statistical distributions of the feature schema for each target class. For example:
- **VoIP**: High UDP ratio, constant low packet size, low variance.
- **HTTP**: High TCP ratio, highly variable packet size, bursty packets/sec.
- **Video**: High UDP/TCP ratio, consistently large packet sizes, high throughput.

## Preprocessing
- **Scaling**: Standard scaling (`StandardScaler`) to normalize features like total bytes and duration.
- **Null Handling**: Missing values will be imputed with 0.

## Train/Validation/Test Split
- 70% Training
- 15% Validation
- 15% Testing

## Class Balance
The synthetic generator will ensure an exact equal distribution of classes (e.g., 2000 samples per class) to prevent class imbalance skewing the Random Forest decision boundaries.

## Leakage Prevention
Synthetic generation will strictly isolate target labels and inject appropriate statistical noise (Gaussian distribution) to ensure the model learns generalized patterns rather than memorizing exact hardcoded thresholds.

## Evaluation Metrics
The model will be evaluated based on:
1. **Accuracy**: Overall correct predictions over total predictions.
2. **F1-Score (Macro)**: To ensure all classes perform well.
3. **Confusion Matrix**: To identify misclassifications (e.g., confusing VoIP with Video due to similar UDP ratios).
