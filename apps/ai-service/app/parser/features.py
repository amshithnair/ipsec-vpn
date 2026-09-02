import numpy as np
from app.parser.pcap_parser import ParseResult

def extract_flow_features(parse_result: ParseResult) -> dict:
    """
    Extracts statistical features from the parsed PCAP data.
    These features are used for the ML Traffic Inference model.
    """
    stats = parse_result.stats
    
    total_packets = stats.total_packets
    if total_packets == 0:
        return {}

    duration = stats.last_timestamp - stats.first_timestamp
    if duration <= 0:
        duration = 0.001  # Prevent division by zero

    total_bytes = sum(stats.packet_sizes)
    
    # Calculate packet size statistics
    if stats.packet_sizes:
        packet_sizes = np.array(stats.packet_sizes)
        avg_packet_size = float(np.mean(packet_sizes))
        packet_size_variance = float(np.var(packet_sizes))
    else:
        avg_packet_size = 0.0
        packet_size_variance = 0.0

    # Ratios
    udp_ratio = stats.udp_packets / total_packets
    tcp_ratio = stats.tcp_packets / total_packets
    
    # Rates
    bytes_per_second = total_bytes / duration
    packets_per_second = total_packets / duration

    return {
        "total_packets": total_packets,
        "total_bytes": total_bytes,
        "duration_seconds": duration,
        "bytes_per_second": bytes_per_second,
        "packets_per_second": packets_per_second,
        "avg_packet_size": avg_packet_size,
        "packet_size_variance": packet_size_variance,
        "udp_ratio": udp_ratio,
        "tcp_ratio": tcp_ratio
    }
