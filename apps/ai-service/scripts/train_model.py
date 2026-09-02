import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report
import joblib

# Target classes
CLASSES = ["VoIP", "HTTP", "VPN", "ICMP", "Video", "Unknown"]

def generate_synthetic_data(num_samples_per_class=2000):
    """
    Generate a synthetic dataset based on the feature schema.
    Applies Gaussian noise to create realistic feature distributions.
    """
    np.random.seed(42)
    data = []
    
    for _ in range(num_samples_per_class):
        # VoIP: Constant bit rate, low variance, mostly UDP
        data.append({
            "total_packets": np.random.normal(5000, 1000),
            "total_bytes": np.random.normal(1000000, 200000),
            "duration_seconds": np.random.normal(120, 30),
            "bytes_per_second": np.random.normal(8333, 500),
            "packets_per_second": np.random.normal(41, 5),
            "avg_packet_size": np.random.normal(200, 20),
            "packet_size_variance": np.random.normal(100, 50),
            "udp_ratio": np.clip(np.random.normal(0.95, 0.05), 0, 1),
            "tcp_ratio": np.clip(np.random.normal(0.05, 0.05), 0, 1),
            "label": "VoIP"
        })
        
        # HTTP: Bursty, highly variable packet sizes, mostly TCP
        data.append({
            "total_packets": np.random.normal(1500, 800),
            "total_bytes": np.random.normal(5000000, 2000000),
            "duration_seconds": np.random.normal(30, 15),
            "bytes_per_second": np.random.normal(166666, 50000),
            "packets_per_second": np.random.normal(50, 30),
            "avg_packet_size": np.random.normal(800, 300),
            "packet_size_variance": np.random.normal(150000, 50000),
            "udp_ratio": np.clip(np.random.normal(0.01, 0.01), 0, 1),
            "tcp_ratio": np.clip(np.random.normal(0.98, 0.02), 0, 1),
            "label": "HTTP"
        })
        
        # VPN: High UDP/TCP, encrypted payload means consistent large packets, high variance depends on encapsulated traffic
        data.append({
            "total_packets": np.random.normal(10000, 5000),
            "total_bytes": np.random.normal(10000000, 3000000),
            "duration_seconds": np.random.normal(300, 100),
            "bytes_per_second": np.random.normal(33333, 10000),
            "packets_per_second": np.random.normal(33, 15),
            "avg_packet_size": np.random.normal(1000, 200),
            "packet_size_variance": np.random.normal(80000, 20000),
            "udp_ratio": np.clip(np.random.normal(0.80, 0.15), 0, 1),
            "tcp_ratio": np.clip(np.random.normal(0.15, 0.10), 0, 1),
            "label": "VPN"
        })
        
        # ICMP: Tiny packets, low throughput
        data.append({
            "total_packets": np.random.normal(50, 20),
            "total_bytes": np.random.normal(4000, 1000),
            "duration_seconds": np.random.normal(50, 10),
            "bytes_per_second": np.random.normal(80, 20),
            "packets_per_second": np.random.normal(1, 0.5),
            "avg_packet_size": np.random.normal(80, 10),
            "packet_size_variance": np.random.normal(10, 5),
            "udp_ratio": np.clip(np.random.normal(0.0, 0.0), 0, 1),
            "tcp_ratio": np.clip(np.random.normal(0.0, 0.0), 0, 1),
            "label": "ICMP"
        })
        
        # Video: High throughput, very large packets, consistent
        data.append({
            "total_packets": np.random.normal(30000, 10000),
            "total_bytes": np.random.normal(45000000, 15000000),
            "duration_seconds": np.random.normal(300, 50),
            "bytes_per_second": np.random.normal(150000, 30000),
            "packets_per_second": np.random.normal(100, 30),
            "avg_packet_size": np.random.normal(1300, 100),
            "packet_size_variance": np.random.normal(20000, 10000),
            "udp_ratio": np.clip(np.random.normal(0.60, 0.30), 0, 1),
            "tcp_ratio": np.clip(np.random.normal(0.35, 0.30), 0, 1),
            "label": "Video"
        })
        
        # Unknown: Random noise
        data.append({
            "total_packets": np.random.uniform(10, 10000),
            "total_bytes": np.random.uniform(1000, 10000000),
            "duration_seconds": np.random.uniform(1, 600),
            "bytes_per_second": np.random.uniform(10, 500000),
            "packets_per_second": np.random.uniform(1, 1000),
            "avg_packet_size": np.random.uniform(50, 1500),
            "packet_size_variance": np.random.uniform(0, 200000),
            "udp_ratio": np.random.uniform(0, 1),
            "tcp_ratio": np.random.uniform(0, 1),
            "label": "Unknown"
        })
        
    df = pd.DataFrame(data)
    
    # Ensure no negative values for natural limits
    for col in df.columns:
        if col != "label":
            df[col] = df[col].clip(lower=0)
            
    return df

def train_and_export():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(2000)
    
    X = df.drop("label", axis=1)
    y = df["label"]
    
    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    print("Evaluating Model...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="macro")
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"F1 Score (Macro): {f1:.4f}")
    print("\nClassification Report:")
    report = classification_report(y_test, y_pred)
    print(report)
    
    # Create directory structure
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/traffic-classifier/v1"))
    os.makedirs(model_dir, exist_ok=True)
    
    # Serialize model
    model_path = os.path.join(model_dir, "model.joblib")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Save metadata
    metadata = {
        "model_name": "Traffic Type Inference RF",
        "model_version": "v1.0.0",
        "model_type": "RandomForestClassifier",
        "features": list(X.columns),
        "classes": list(model.classes_),
        "metrics": {
            "accuracy": accuracy,
            "f1_macro": f1
        },
        "training_samples": len(X_train)
    }
    
    metadata_path = os.path.join(model_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print("Training complete.")

if __name__ == "__main__":
    train_and_export()
