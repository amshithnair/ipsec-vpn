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
    """Build a simplified IKEv2 SA payload with proposal and transforms."""
    # This builds a minimal SA payload that Scapy/our parser can recognize
    # Transform: Encryption
    enc_transform = struct.pack("!BBH BBH HH",
        3, 0, 12,     # next=3(more), reserved, length
        1, 0, enc_id, # transform_type=ENCR, reserved, transform_id
        0x800E, enc_key_len,  # Key Length attribute (type 14)
    )
    
    # Transform: Integrity/Auth
    auth_transform = struct.pack("!BBH BBH",
        3, 0, 8,       # next=3(more), reserved, length
        3, 0, auth_id, # transform_type=INTEG, reserved, transform_id
    )
    
    # Transform: DH Group
    dh_transform = struct.pack("!BBH BBH",
        0, 0, 8,         # next=0(last), reserved, length
        4, 0, dh_group,  # transform_type=DH, reserved, transform_id
    )
    
    transforms = enc_transform + auth_transform + dh_transform
    
    # Proposal
    proposal = struct.pack("!BBHBBBB",
        0,                       # last proposal
        0,                       # reserved
        8 + len(transforms),     # proposal length
        1,                       # proposal number
        1,                       # protocol: IKE
        0,                       # SPI size
        3,                       # num transforms
    )
    
    # SA payload header
    sa_payload = struct.pack("!BBH",
        0,                                      # next payload = none
        0,                                      # critical bit
        4 + len(proposal) + len(transforms),    # length
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


def create_ikev1_main_mode(src_ip, dst_ip, init_cookie, resp_cookie, enc_id, auth_id, dh_group):
    """Create an IKEv1 Main Mode (Identity Protection) packet."""
    sa_payload = build_ikev2_sa_init_payload(enc_id, 0, auth_id, dh_group)
    
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


if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "pcaps")
    os.makedirs(output_dir, exist_ok=True)
    
    generate_strong_ipsec_pcap(os.path.join(output_dir, "strong-ipsec.pcap"))
    generate_weak_ipsec_pcap(os.path.join(output_dir, "weak-ipsec.pcap"))
    generate_non_ipsec_pcap(os.path.join(output_dir, "non-ipsec.pcap"))
    generate_moderate_ipsec_pcap(os.path.join(output_dir, "moderate-ipsec.pcap"))
    
    print(f"\n🎯 All demo PCAPs generated in: {output_dir}")
