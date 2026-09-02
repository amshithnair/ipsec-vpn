"""
Demo PCAP Generator — Creates synthetic IPsec/IKE PCAP files for testing.
Generates both strong and weak VPN configurations for demo purposes.
"""

import os
import struct
import sys

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scapy.all import (
    Ether, IP, UDP, Raw, wrpcap,
    conf,
)

# Suppress Scapy warnings
conf.verb = 0


def build_ike_header(init_spi, resp_spi, next_payload, version_major, version_minor, exchange_type, flags, message_id, length):
    """Build a raw IKE header (28 bytes)."""
    version = ((version_major & 0x0F) << 4) | (version_minor & 0x0F)
    header = struct.pack("!8s8sBBBBII",
        init_spi,
        resp_spi,
        next_payload,
        version,
        exchange_type,
        flags,
        message_id,
        length,
    )
    return header


def build_ikev2_sa_init_payload(enc_id, enc_key_len, auth_id, dh_group):
    """Build a standard compliant IKEv2 SA payload with proposal and transforms."""
    if enc_key_len > 0:
        enc_transform = struct.pack("!BBHBBHHH",
            3, 0, 12,        # last=3(more), reserved, length=12
            1, 0, enc_id,    # transform_type=1(ENCR), reserved, transform_id
            0x800E, enc_key_len  # attribute: Type 14 (Key Length), Value
        )
    else:
        enc_transform = struct.pack("!BBHBBH",
            3, 0, 8,         # last=3(more), reserved, length=8
            1, 0, enc_id     # transform_type=1(ENCR), reserved, transform_id
        )

    auth_transform = struct.pack("!BBHBBH",
        3, 0, 8,             # last=3(more), reserved, length=8
        3, 0, auth_id        # transform_type=3(INTEG), reserved, transform_id
    )

    dh_transform = struct.pack("!BBHBBH",
        0, 0, 8,             # last=0(last), reserved, length=8
        4, 0, dh_group       # transform_type=4(D-H), reserved, transform_id
    )

    transforms = enc_transform + auth_transform + dh_transform

    proposal = struct.pack("!BBHBBBB",
        0,                   # last proposal = 0
        0,                   # reserved
        8 + len(transforms), # proposal length
        1,                   # proposal number
        1,                   # protocol: IKE
        0,                   # SPI size
        3,                   # num transforms
    )

    sa_payload = struct.pack("!BBH",
        0,                   # next payload = 0
        0,                   # critical bit
        4 + len(proposal) + len(transforms),
    )

    return sa_payload + proposal + transforms



def create_ikev2_sa_init(src_ip, dst_ip, init_spi, resp_spi, enc_id, enc_key_len, auth_id, dh_group, message_id=0):
    """Create an IKEv2 SA_INIT packet."""
    sa_payload = build_ikev2_sa_init_payload(enc_id, enc_key_len, auth_id, dh_group)
    
    total_length = 28 + len(sa_payload)  # IKE header + SA payload
    ike_header = build_ike_header(
        init_spi, resp_spi,
        next_payload=33,  # SA
        version_major=2, version_minor=0,
        exchange_type=34,  # IKE_SA_INIT
        flags=0x08,  # Initiator
        message_id=message_id,
        length=total_length,
    )
    
    payload = ike_header + sa_payload
    
    pkt = Ether() / IP(src=src_ip, dst=dst_ip) / UDP(sport=500, dport=500) / Raw(load=payload)
    return pkt


def create_esp_packet(src_ip, dst_ip, spi, seq_num, payload_size=64):
    """Create an ESP packet (IP proto 50)."""
    esp_header = struct.pack("!II", spi, seq_num)
    # Random-ish encrypted payload
    encrypted_data = bytes(range(payload_size % 256)) * (payload_size // 256 + 1)
    encrypted_data = encrypted_data[:payload_size]
    
    esp_data = esp_header + encrypted_data
    
    # Build as IP packet with protocol 50 (ESP)
    pkt = Ether() / IP(src=src_ip, dst=dst_ip, proto=50) / Raw(load=esp_data)
    return pkt


def build_ikev1_sa_payload(enc_id, hash_id, auth_method, dh_group):
    """
    Build an RFC 2408 / RFC 2409 compliant IKEv1 SA payload with ISAKMP transform attributes.
    """
    # SA Attributes in TV (Type/Value) format: Type (2B), Value (2B)
    # Type 1 = Encryption Algorithm (5 = 3DES-CBC)
    # Type 2 = Hash Algorithm (2 = SHA1, 1 = MD5)
    # Type 3 = Authentication Method (1 = PSK)
    # Type 4 = Group Description (2 = Group 2)
    attr_enc = struct.pack("!HH", 0x8001, enc_id)
    attr_hash = struct.pack("!HH", 0x8002, hash_id)
    attr_auth = struct.pack("!HH", 0x8003, auth_method)
    attr_dh = struct.pack("!HH", 0x8004, dh_group)
    
    attributes = attr_enc + attr_hash + attr_auth + attr_dh
    
    # Transform Payload (RFC 2408 Section 3.6): next_payload(1B)=0, reserved(1B)=0, length(2B), transform_num(1B)=1, transform_id(1B)=1 (KEY_IKE), reserved(2B)=0
    trans_len = 8 + len(attributes)
    transform = struct.pack("!BBHBBH", 0, 0, trans_len, 1, 1, 0) + attributes
    
    # Proposal Payload (RFC 2408 Section 3.5): next_payload(1B)=0, reserved(1B)=0, length(2B), proposal_num(1B)=1, protocol_id(1B)=1 (ISAKMP), spi_size(1B)=0, num_transforms(1B)=1
    prop_len = 8 + len(transform)
    proposal = struct.pack("!BBHBBBB", 0, 0, prop_len, 1, 1, 0, 1) + transform
    
    # SA Payload (RFC 2408 Section 3.4): next_payload(1B)=0, reserved(1B)=0, length(2B), DOI(4B)=1 (IPsec), Situation(4B)=1 (Identity Only)
    sa_len = 12 + len(proposal)
    sa_header = struct.pack("!BBHII", 0, 0, sa_len, 1, 1)
    
    return sa_header + proposal


def create_ikev1_main_mode(src_ip, dst_ip, init_cookie, resp_cookie, enc_id, auth_id, dh_group):
    """Create an IKEv1 Main Mode (Identity Protection) packet."""
    sa_payload = build_ikev1_sa_payload(enc_id, auth_id, 1, dh_group)
    
    total_length = 28 + len(sa_payload)
    ike_header = build_ike_header(
        init_cookie, resp_cookie,
        next_payload=1,   # SA
        version_major=1, version_minor=0,
        exchange_type=2,  # Identity Protection (Main Mode)
        flags=0,
        message_id=0,
        length=total_length,
    )
    
    payload = ike_header + sa_payload
    
    pkt = Ether() / IP(src=src_ip, dst=dst_ip) / UDP(sport=500, dport=500) / Raw(load=payload)
    return pkt


def generate_strong_ipsec_pcap(output_path):
    """
    Generate a strong IPsec configuration PCAP:
    - IKEv2
    - AES-256-GCM (enc_id=20, key_len=256)
    - SHA-256 (auth_id=12)
    - DH Group 14
    - PFS (CREATE_CHILD_SA with DH)
    """
    packets = []
    src_ip = "10.0.1.1"
    dst_ip = "10.0.2.1"
    
    init_spi = b'\xaa\xbb\xcc\xdd\xee\xff\x00\x11'
    resp_spi = b'\x00\x00\x00\x00\x00\x00\x00\x00'
    
    # IKE_SA_INIT request
    pkt1 = create_ikev2_sa_init(src_ip, dst_ip, init_spi, resp_spi,
                                 enc_id=20, enc_key_len=256, auth_id=12, dh_group=14)
    packets.append(pkt1)
    
    # IKE_SA_INIT response
    resp_spi2 = b'\x11\x22\x33\x44\x55\x66\x77\x88'
    pkt2 = create_ikev2_sa_init(dst_ip, src_ip, init_spi, resp_spi2,
                                 enc_id=20, enc_key_len=256, auth_id=12, dh_group=14)
    packets.append(pkt2)
    
    # CREATE_CHILD_SA (for PFS detection) — simplified
    child_sa_header = build_ike_header(
        init_spi, resp_spi2,
        next_payload=33,
        version_major=2, version_minor=0,
        exchange_type=36,  # CREATE_CHILD_SA
        flags=0x08,
        message_id=1,
        length=28 + 20,
    )
    # Minimal SA payload for child
    child_sa_payload = build_ikev2_sa_init_payload(20, 256, 12, 14)
    child_pkt = Ether() / IP(src=src_ip, dst=dst_ip) / UDP(sport=500, dport=500) / Raw(load=child_sa_header + child_sa_payload)
    packets.append(child_pkt)
    
    # ESP traffic (encrypted tunnel data)
    spi_out = 0xDEADBEEF
    for seq in range(1, 51):
        packets.append(create_esp_packet(src_ip, dst_ip, spi_out, seq, payload_size=128))
    
    spi_in = 0xCAFEBABE
    for seq in range(1, 51):
        packets.append(create_esp_packet(dst_ip, src_ip, spi_in, seq, payload_size=96))
    
    wrpcap(output_path, packets)
    print(f"✅ Generated strong IPsec PCAP: {output_path} ({len(packets)} packets)")


def generate_weak_ipsec_pcap(output_path):
    """
    Generate a weak/legacy IPsec configuration PCAP:
    - IKEv1
    - 3DES-CBC (enc_id=5)
    - SHA-1 (auth_id=2)
    - DH Group 2
    - No PFS
    """
    packets = []
    src_ip = "192.168.1.1"
    dst_ip = "192.168.2.1"
    
    init_cookie = b'\xde\xad\xbe\xef\xca\xfe\xba\xbe'
    resp_cookie = b'\x00\x00\x00\x00\x00\x00\x00\x00'
    
    # IKEv1 Main Mode request
    pkt1 = create_ikev1_main_mode(src_ip, dst_ip, init_cookie, resp_cookie,
                                    enc_id=5, auth_id=2, dh_group=2)
    packets.append(pkt1)
    
    # IKEv1 Main Mode response
    resp_cookie2 = b'\xba\xad\xf0\x0d\xba\xad\xf0\x0d'
    pkt2 = create_ikev1_main_mode(dst_ip, src_ip, init_cookie, resp_cookie2,
                                    enc_id=5, auth_id=2, dh_group=2)
    packets.append(pkt2)
    
    # ESP traffic (no PFS, no CREATE_CHILD_SA)
    spi_out = 0x12345678
    for seq in range(1, 31):
        packets.append(create_esp_packet(src_ip, dst_ip, spi_out, seq, payload_size=80))
    
    spi_in = 0x87654321
    for seq in range(1, 31):
        packets.append(create_esp_packet(dst_ip, src_ip, spi_in, seq, payload_size=80))
    
    wrpcap(output_path, packets)
    print(f"✅ Generated weak IPsec PCAP: {output_path} ({len(packets)} packets)")


def generate_non_ipsec_pcap(output_path):
    """Generate a PCAP with regular HTTP-like traffic (no IPsec)."""
    packets = []
    src_ip = "10.0.0.1"
    dst_ip = "93.184.216.34"
    
    for i in range(20):
        pkt = Ether() / IP(src=src_ip, dst=dst_ip) / UDP(sport=12345, dport=53) / Raw(load=b'\x00' * 32)
        packets.append(pkt)
    
    wrpcap(output_path, packets)
    print(f"✅ Generated non-IPsec PCAP: {output_path} ({len(packets)} packets)")


def generate_moderate_ipsec_pcap(output_path):
    """
    Generate a moderate IPsec configuration PCAP:
    - IKEv2
    - AES-128-CBC (enc_id=12, key_len=128) — acceptable but CBC mode
    - SHA-1 (auth_id=2) — deprecated
    - DH Group 14 — acceptable
    - No PFS detected
    """
    packets = []
    src_ip = "172.16.0.1"
    dst_ip = "172.16.0.2"
    
    init_spi = b'\x01\x02\x03\x04\x05\x06\x07\x08'
    resp_spi = b'\x00\x00\x00\x00\x00\x00\x00\x00'
    
    # IKE_SA_INIT
    pkt1 = create_ikev2_sa_init(src_ip, dst_ip, init_spi, resp_spi,
                                 enc_id=12, enc_key_len=128, auth_id=2, dh_group=14)
    packets.append(pkt1)
    
    resp_spi2 = b'\x08\x07\x06\x05\x04\x03\x02\x01'
    pkt2 = create_ikev2_sa_init(dst_ip, src_ip, init_spi, resp_spi2,
                                 enc_id=12, enc_key_len=128, auth_id=2, dh_group=14)
    packets.append(pkt2)
    
    # ESP traffic
    spi_out = 0xAAAABBBB
    for seq in range(1, 41):
        packets.append(create_esp_packet(src_ip, dst_ip, spi_out, seq, payload_size=100))
    
    wrpcap(output_path, packets)
    print(f"✅ Generated moderate IPsec PCAP: {output_path} ({len(packets)} packets)")


def generate_anomalous_vpn_pcap(output_path):
    """
    Generate an anomalous encrypted VPN communication capture:
    - IKEv2 handshake
    - Highly asymmetric, erratic burst payload sizes (e.g. 1400 bytes outbound vs 40 bytes inbound)
    - Extreme packet size variance and abnormal inter-arrival timing
    - Triggers Isolation Forest behavioral anomaly detection.
    """
    packets = []
    src_ip = "192.168.100.50"
    dst_ip = "198.51.100.1"

    init_spi = b'\xfe\xdc\xba\x98\x76\x54\x32\x10'
    resp_spi = b'\x00\x00\x00\x00\x00\x00\x00\x00'

    # IKEv2 handshake
    pkt1 = create_ikev2_sa_init(src_ip, dst_ip, init_spi, resp_spi,
                                 enc_id=20, enc_key_len=256, auth_id=12, dh_group=14)
    packets.append(pkt1)

    resp_spi2 = b'\x01\x23\x45\x67\x89\xab\xcd\xef'
    pkt2 = create_ikev2_sa_init(dst_ip, src_ip, init_spi, resp_spi2,
                                 enc_id=20, enc_key_len=256, auth_id=12, dh_group=14)
    packets.append(pkt2)

    # Bursty, anomalous ESP traffic
    spi_out = 0x5555AAAA
    spi_in = 0xAAAA5555

    # Outbound massive data bursts (simulating large asymmetric exfiltration/burst)
    for seq in range(1, 80):
        # erratic sizes between 400 and 1400 bytes
        sz = 1400 if seq % 2 == 0 else 450
        packets.append(create_esp_packet(src_ip, dst_ip, spi_out, seq, payload_size=sz))

    # Sparse tiny ACKs
    for seq in range(1, 10):
        packets.append(create_esp_packet(dst_ip, src_ip, spi_in, seq, payload_size=32))

    wrpcap(output_path, packets)
    print(f"✅ Generated anomalous VPN PCAP: {output_path} ({len(packets)} packets)")


if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "pcaps")
    os.makedirs(output_dir, exist_ok=True)

    generate_strong_ipsec_pcap(os.path.join(output_dir, "strong-ipsec.pcap"))
    generate_weak_ipsec_pcap(os.path.join(output_dir, "weak-ipsec.pcap"))
    generate_anomalous_vpn_pcap(os.path.join(output_dir, "anomalous-vpn.pcap"))
    generate_non_ipsec_pcap(os.path.join(output_dir, "non-ipsec.pcap"))
    generate_moderate_ipsec_pcap(os.path.join(output_dir, "moderate-ipsec.pcap"))

    print(f"\n🎯 All demo PCAPs generated in: {output_dir}")

