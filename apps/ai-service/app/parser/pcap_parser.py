"""
PCAP Parser — Scapy-based packet capture parser.
Extracts IPsec/IKE protocol information from PCAP files.
"""

from __future__ import annotations

import os
import time
import hashlib
from typing import Optional
from dataclasses import dataclass, field

from scapy.all import (
    rdpcap,
    IP,
    IPv6,
    UDP,
    TCP,
    Raw,
)

# IKE/ESP/AH layer imports
try:
    from scapy.layers.ipsec import ESP, AH
    from scapy.layers.isakmp import ISAKMP, ISAKMP_payload_SA, ISAKMP_payload_Proposal, ISAKMP_payload_Transform
    HAS_ISAKMP = True
except ImportError:
    HAS_ISAKMP = False

# IKEv2 support
try:
    from scapy.contrib.ikev2 import (
        IKEv2,
        IKEv2_payload_SA,
        IKEv2_payload_Proposal,
        IKEv2_payload_Transform,
        IKEv2_payload_KE,
        IKEv2_payload_Nonce,
    )
    HAS_IKEV2 = True
except ImportError:
    HAS_IKEV2 = False


# ── IKE Constants ──

ENCRYPTION_ALGORITHMS = {
    # IKEv1 Transform IDs (RFC 2409)
    1: "DES-CBC",
    2: "IDEA-CBC",
    3: "Blowfish-CBC",
    4: "RC5-R16-B64-CBC",
    5: "3DES-CBC",
    6: "CAST-CBC",
    7: "AES-CBC",
    8: "CAMELLIA-CBC",
    # IKEv2 Transform IDs (RFC 7296)
    12: "AES-CBC",
    13: "AES-CTR",
    14: "AES-CCM-8",
    15: "AES-CCM-12",
    16: "AES-CCM-16",
    18: "AES-GCM-8",
    19: "AES-GCM-12",
    20: "AES-GCM-16",
    23: "CAMELLIA-CBC",
    28: "CHACHA20-POLY1305",
}

AUTH_ALGORITHMS = {
    1: "HMAC-MD5-96",
    2: "HMAC-SHA1-96",
    3: "DES-MAC",
    5: "HMAC-SHA-256-128",
    6: "HMAC-SHA-384-192",
    7: "HMAC-SHA-512-256",
    9: "AES-CMAC-96",
    12: "HMAC-SHA-256",
    13: "HMAC-SHA-384",
    14: "HMAC-SHA-512",
}

DH_GROUPS = {
    1: {"name": "modp768", "bits": 768, "strength": "critical"},
    2: {"name": "modp1024", "bits": 1024, "strength": "weak"},
    5: {"name": "modp1536", "bits": 1536, "strength": "marginal"},
    14: {"name": "modp2048", "bits": 2048, "strength": "acceptable"},
    15: {"name": "modp3072", "bits": 3072, "strength": "strong"},
    16: {"name": "modp4096", "bits": 4096, "strength": "strong"},
    17: {"name": "modp6144", "bits": 6144, "strength": "strong"},
    18: {"name": "modp8192", "bits": 8192, "strength": "strong"},
    19: {"name": "ecp256", "bits": 256, "strength": "strong"},
    20: {"name": "ecp384", "bits": 384, "strength": "strong"},
    21: {"name": "ecp521", "bits": 521, "strength": "strong"},
}

IKE_EXCHANGE_TYPES = {
    # IKEv1
    1: "Base",
    2: "Identity Protection (Main Mode)",
    3: "Authentication Only",
    4: "Aggressive",
    5: "Informational",
    32: "Quick Mode",
    33: "New Group Mode",
    # IKEv2
    34: "IKE_SA_INIT",
    35: "IKE_AUTH",
    36: "CREATE_CHILD_SA",
    37: "INFORMATIONAL",
}


@dataclass
class PacketStats:
    """Statistics about parsed packets."""
    total_packets: int = 0
    ip_packets: int = 0
    udp_packets: int = 0
    tcp_packets: int = 0
    ike_packets: int = 0
    esp_packets: int = 0
    ah_packets: int = 0
    non_ipsec_packets: int = 0
    first_timestamp: float = 0.0
    last_timestamp: float = 0.0
    packet_sizes: list[int] = field(default_factory=list)
    inter_arrival_times: list[float] = field(default_factory=list)


@dataclass
class IKEInfo:
    """Extracted IKE (Internet Key Exchange) information."""
    version: Optional[str] = None  # IKEv1 or IKEv2
    exchange_types: list[str] = field(default_factory=list)
    initiator_spi: Optional[str] = None
    responder_spi: Optional[str] = None
    proposals: list[dict] = field(default_factory=list)
    encryption_algorithms: list[str] = field(default_factory=list)
    auth_algorithms: list[str] = field(default_factory=list)
    dh_groups: list[int] = field(default_factory=list)
    key_lengths: list[int] = field(default_factory=list)
    has_nonce: bool = False
    has_ke: bool = False


@dataclass
class ESPInfo:
    """Extracted ESP (Encapsulating Security Payload) information."""
    spis: list[str] = field(default_factory=list)
    sequence_numbers: list[int] = field(default_factory=list)
    packet_count: int = 0


@dataclass
class AHInfo:
    """Extracted AH (Authentication Header) information."""
    spis: list[str] = field(default_factory=list)
    sequence_numbers: list[int] = field(default_factory=list)
    icv_lengths: list[int] = field(default_factory=list)
    packet_count: int = 0


@dataclass
class ParseResult:
    """Complete PCAP parse result."""
    success: bool = False
    error: Optional[str] = None
    file_hash: str = ""
    file_size: int = 0
    stats: PacketStats = field(default_factory=PacketStats)
    ike_info: IKEInfo = field(default_factory=IKEInfo)
    esp_info: ESPInfo = field(default_factory=ESPInfo)
    ah_info: AHInfo = field(default_factory=AHInfo)
    has_ipsec: bool = False
    has_ike: bool = False
    has_esp: bool = False
    has_ah: bool = False


class PcapParser:
    """
    Parses PCAP files and extracts IPsec/IKE protocol information.
    Uses Scapy for packet-level analysis.
    """

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS = {".pcap", ".pcapng", ".cap"}

    def validate_file(self, file_path: str) -> tuple[bool, str]:
        """Validate that the file exists, is within size limits, and has correct extension."""
        if not os.path.exists(file_path):
            return False, f"File not found: {file_path}"

        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return False, f"Invalid file extension: {ext}. Allowed: {self.ALLOWED_EXTENSIONS}"

        file_size = os.path.getsize(file_path)
        if file_size > self.MAX_FILE_SIZE:
            return False, f"File too large: {file_size} bytes (max {self.MAX_FILE_SIZE})"

        if file_size == 0:
            return False, "File is empty"

        return True, ""

    def compute_hash(self, file_path: str) -> str:
        """Compute SHA-256 hash of the file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def parse(self, file_path: str) -> ParseResult:
        """
        Parse a PCAP file and extract all IPsec/IKE information.
        This is the main entry point for PCAP analysis.
        """
        result = ParseResult()

        # Validate
        valid, error = self.validate_file(file_path)
        if not valid:
            result.error = error
            return result

        result.file_size = os.path.getsize(file_path)
        result.file_hash = self.compute_hash(file_path)

        # Parse with Scapy
        try:
            packets = rdpcap(file_path)
        except Exception as e:
            result.error = f"Failed to parse PCAP: {str(e)}"
            return result

        if len(packets) == 0:
            result.error = "PCAP file contains no packets"
            return result

        result.stats.total_packets = len(packets)

        # Extract timestamps
        timestamps = []
        for pkt in packets:
            if hasattr(pkt, 'time'):
                timestamps.append(float(pkt.time))

        if timestamps:
            result.stats.first_timestamp = timestamps[0]
            result.stats.last_timestamp = timestamps[-1]
            # Calculate inter-arrival times
            for i in range(1, len(timestamps)):
                iat = timestamps[i] - timestamps[i - 1]
                if iat >= 0:
                    result.stats.inter_arrival_times.append(iat)

        # Process each packet
        for pkt in packets:
            result.stats.packet_sizes.append(len(pkt))
            self._process_packet(pkt, result)

        # Determine protocol detection
        result.has_ike = result.stats.ike_packets > 0
        result.has_esp = result.stats.esp_packets > 0
        result.has_ah = result.stats.ah_packets > 0
        result.has_ipsec = result.has_ike or result.has_esp or result.has_ah

        result.stats.non_ipsec_packets = (
            result.stats.total_packets
            - result.stats.ike_packets
            - result.stats.esp_packets
            - result.stats.ah_packets
        )

        result.success = True
        return result

    def _process_packet(self, pkt, result: ParseResult):
        """Process a single packet and update the result."""
        # Count IP packets
        if pkt.haslayer(IP) or pkt.haslayer(IPv6):
            result.stats.ip_packets += 1
        if pkt.haslayer(UDP):
            result.stats.udp_packets += 1
        if pkt.haslayer(TCP):
            result.stats.tcp_packets += 1

        # Check for IKE (UDP 500 or 4500)
        if pkt.haslayer(UDP):
            udp = pkt[UDP]
            if udp.sport in (500, 4500) or udp.dport in (500, 4500):
                self._process_ike_packet(pkt, result)
                return

        # Check for ESP
        if pkt.haslayer(ESP):
            self._process_esp_packet(pkt, result)
            return

        # Check for AH
        if pkt.haslayer(AH):
            self._process_ah_packet(pkt, result)
            return

        # Check for ESP/AH by IP protocol number
        if pkt.haslayer(IP):
            ip = pkt[IP]
            if ip.proto == 50:  # ESP
                self._process_esp_raw(pkt, result)
                return
            elif ip.proto == 51:  # AH
                self._process_ah_raw(pkt, result)
                return

    def _process_ike_packet(self, pkt, result: ParseResult):
        """Process an IKE packet."""
        result.stats.ike_packets += 1

        # Try IKEv2 first
        if HAS_IKEV2 and pkt.haslayer(IKEv2):
            self._parse_ikev2(pkt, result)
            return

        # Try IKEv1 (ISAKMP)
        if HAS_ISAKMP and pkt.haslayer(ISAKMP):
            self._parse_ikev1(pkt, result)
            return

        # Fallback: try to determine IKE version from raw payload
        if pkt.haslayer(UDP):
            udp = pkt[UDP]
            payload = bytes(udp.payload)
            if len(payload) >= 18:
                # IKE header: initiator SPI (8) + responder SPI (8) + next payload (1) + version (1)
                version_byte = payload[17]
                major_version = (version_byte >> 4) & 0x0F
                if major_version == 2:
                    result.ike_info.version = "IKEv2"
                    self._parse_ike_raw(payload, result, is_v2=True)
                elif major_version == 1:
                    result.ike_info.version = "IKEv1"
                    self._parse_ike_raw(payload, result, is_v2=False)

    def _parse_ikev2(self, pkt, result: ParseResult):
        """Parse IKEv2 packet using Scapy's IKEv2 dissector."""
        result.ike_info.version = "IKEv2"
        ikev2 = pkt[IKEv2]

        # Exchange type
        if hasattr(ikev2, 'exch_type'):
            etype = IKE_EXCHANGE_TYPES.get(ikev2.exch_type, f"Unknown({ikev2.exch_type})")
            if etype not in result.ike_info.exchange_types:
                result.ike_info.exchange_types.append(etype)

        # SPIs
        if hasattr(ikev2, 'init_SPI'):
            spi = ikev2.init_SPI.hex() if isinstance(ikev2.init_SPI, bytes) else str(ikev2.init_SPI)
            result.ike_info.initiator_spi = spi
        if hasattr(ikev2, 'resp_SPI'):
            spi = ikev2.resp_SPI.hex() if isinstance(ikev2.resp_SPI, bytes) else str(ikev2.resp_SPI)
            result.ike_info.responder_spi = spi

        # Parse SA payloads for proposals/transforms
        if pkt.haslayer(IKEv2_payload_SA):
            self._parse_ikev2_sa(pkt, result)

        # Check for KE payload (indicates DH exchange)
        if pkt.haslayer(IKEv2_payload_KE):
            result.ike_info.has_ke = True
            ke = pkt[IKEv2_payload_KE]
            if hasattr(ke, 'group'):
                if ke.group not in result.ike_info.dh_groups:
                    result.ike_info.dh_groups.append(ke.group)

        # Check for Nonce payload
        if pkt.haslayer(IKEv2_payload_Nonce):
            result.ike_info.has_nonce = True

    def _parse_ikev2_sa(self, pkt, result: ParseResult):
        """Parse IKEv2 SA payload for proposals and transforms."""
        layer = pkt[IKEv2_payload_SA]
        
        # Walk proposals
        proposal = layer
        while proposal:
            if hasattr(proposal, 'payload') and isinstance(proposal.payload, IKEv2_payload_Proposal):
                proposal = proposal.payload
            elif isinstance(proposal, IKEv2_payload_Proposal):
                prop_info = {"proposal_num": getattr(proposal, 'proposal', 0), "transforms": []}
                
                # Walk transforms within proposal
                trans = proposal
                while trans:
                    if hasattr(trans, 'payload') and isinstance(trans.payload, IKEv2_payload_Transform):
                        trans = trans.payload
                    elif isinstance(trans, IKEv2_payload_Transform):
                        self._extract_ikev2_transform(trans, result, prop_info)
                        if hasattr(trans, 'payload') and trans.payload:
                            trans = trans.payload
                        else:
                            break
                    else:
                        break
                
                result.ike_info.proposals.append(prop_info)
                if hasattr(proposal, 'payload') and proposal.payload:
                    proposal = proposal.payload
                else:
                    break
            else:
                break

    def _extract_ikev2_transform(self, trans, result: ParseResult, prop_info: dict):
        """Extract transform details from IKEv2 transform payload."""
        transform_type = getattr(trans, 'transform_type', None)
        transform_id = getattr(trans, 'transform_id', None)

        if transform_type is None or transform_id is None:
            return

        if transform_type == 1:  # Encryption
            algo_name = ENCRYPTION_ALGORITHMS.get(transform_id, f"ENC-{transform_id}")
            # Check for key length attribute
            key_len = getattr(trans, 'key_length', None)
            if key_len:
                algo_name = f"{algo_name.split('-CBC')[0].split('-GCM')[0].split('-CTR')[0]}-{key_len}"
                if 'GCM' in ENCRYPTION_ALGORITHMS.get(transform_id, ''):
                    algo_name += "-GCM"
                elif 'CTR' in ENCRYPTION_ALGORITHMS.get(transform_id, ''):
                    algo_name += "-CTR"
                elif 'CBC' in ENCRYPTION_ALGORITHMS.get(transform_id, ''):
                    algo_name += "-CBC"
                result.ike_info.key_lengths.append(key_len)
            if algo_name not in result.ike_info.encryption_algorithms:
                result.ike_info.encryption_algorithms.append(algo_name)
            prop_info["transforms"].append({"type": "encryption", "value": algo_name})

        elif transform_type == 3:  # Integrity/Auth
            algo_name = AUTH_ALGORITHMS.get(transform_id, f"AUTH-{transform_id}")
            if algo_name not in result.ike_info.auth_algorithms:
                result.ike_info.auth_algorithms.append(algo_name)
            prop_info["transforms"].append({"type": "authentication", "value": algo_name})

        elif transform_type == 4:  # DH Group
            if transform_id not in result.ike_info.dh_groups:
                result.ike_info.dh_groups.append(transform_id)
            prop_info["transforms"].append({"type": "dh_group", "value": transform_id})

    def _parse_ikev1(self, pkt, result: ParseResult):
        """Parse IKEv1 (ISAKMP) packet."""
        result.ike_info.version = "IKEv1"
        isakmp = pkt[ISAKMP]

        # Exchange type
        if hasattr(isakmp, 'exch_type'):
            etype = IKE_EXCHANGE_TYPES.get(isakmp.exch_type, f"Unknown({isakmp.exch_type})")
            if etype not in result.ike_info.exchange_types:
                result.ike_info.exchange_types.append(etype)

        # SPIs
        if hasattr(isakmp, 'init_cookie'):
            result.ike_info.initiator_spi = isakmp.init_cookie.hex() if isinstance(isakmp.init_cookie, bytes) else str(isakmp.init_cookie)
        if hasattr(isakmp, 'resp_cookie'):
            result.ike_info.responder_spi = isakmp.resp_cookie.hex() if isinstance(isakmp.resp_cookie, bytes) else str(isakmp.resp_cookie)

        # Parse SA proposals
        if pkt.haslayer(ISAKMP_payload_SA):
            self._parse_ikev1_sa(pkt, result)

    def _parse_ikev1_sa(self, pkt, result: ParseResult):
        """Parse IKEv1 SA payload."""
        # Walk through proposal and transform payloads
        if pkt.haslayer(ISAKMP_payload_Proposal):
            proposal = pkt[ISAKMP_payload_Proposal]
            prop_info = {"proposal_num": getattr(proposal, 'proposal', 0), "transforms": []}

            if pkt.haslayer(ISAKMP_payload_Transform):
                transform = pkt[ISAKMP_payload_Transform]
                # IKEv1 transforms have SA attributes
                # Try to extract common attributes
                if hasattr(transform, 'transforms'):
                    for attr in transform.transforms:
                        attr_type = getattr(attr, 'type', None)
                        attr_value = getattr(attr, 'value', None)
                        if attr_type == 1:  # Encryption
                            algo_name = ENCRYPTION_ALGORITHMS.get(attr_value, f"ENC-{attr_value}")
                            if algo_name not in result.ike_info.encryption_algorithms:
                                result.ike_info.encryption_algorithms.append(algo_name)
                        elif attr_type == 2:  # Hash/Auth
                            algo_name = AUTH_ALGORITHMS.get(attr_value, f"AUTH-{attr_value}")
                            if algo_name not in result.ike_info.auth_algorithms:
                                result.ike_info.auth_algorithms.append(algo_name)
                        elif attr_type == 4:  # DH Group
                            if attr_value not in result.ike_info.dh_groups:
                                result.ike_info.dh_groups.append(attr_value)

            result.ike_info.proposals.append(prop_info)

    def _parse_ike_raw(self, payload: bytes, result: ParseResult, is_v2: bool):
        """Fallback raw IKE header parsing when Scapy dissectors fail."""
        if len(payload) < 28:
            return

        # Extract SPIs
        init_spi = payload[0:8].hex()
        resp_spi = payload[8:16].hex()
        result.ike_info.initiator_spi = init_spi
        result.ike_info.responder_spi = resp_spi

        # Exchange type
        exchange_type = payload[18]
        etype = IKE_EXCHANGE_TYPES.get(exchange_type, f"Unknown({exchange_type})")
        if etype not in result.ike_info.exchange_types:
            result.ike_info.exchange_types.append(etype)

    def _process_esp_packet(self, pkt, result: ParseResult):
        """Process an ESP packet."""
        result.stats.esp_packets += 1
        esp = pkt[ESP]

        spi = hex(esp.spi) if hasattr(esp, 'spi') else None
        if spi and spi not in result.esp_info.spis:
            result.esp_info.spis.append(spi)

        seq = getattr(esp, 'seq', None)
        if seq is not None:
            result.esp_info.sequence_numbers.append(seq)

        result.esp_info.packet_count += 1

    def _process_ah_packet(self, pkt, result: ParseResult):
        """Process an AH packet."""
        result.stats.ah_packets += 1
        ah = pkt[AH]

        spi = hex(ah.spi) if hasattr(ah, 'spi') else None
        if spi and spi not in result.ah_info.spis:
            result.ah_info.spis.append(spi)

        seq = getattr(ah, 'seq', None)
        if seq is not None:
            result.ah_info.sequence_numbers.append(seq)

        # ICV length estimation
        icv_data = getattr(ah, 'icv', None) or getattr(ah, 'authdata', None)
        if icv_data and isinstance(icv_data, bytes):
            result.ah_info.icv_lengths.append(len(icv_data) * 8)

        result.ah_info.packet_count += 1

    def _process_esp_raw(self, pkt, result: ParseResult):
        """Process ESP by raw IP protocol number when Scapy doesn't dissect it."""
        result.stats.esp_packets += 1
        result.esp_info.packet_count += 1

        if pkt.haslayer(IP):
            ip = pkt[IP]
            payload = bytes(ip.payload)
            if len(payload) >= 8:
                spi = hex(int.from_bytes(payload[0:4], 'big'))
                seq = int.from_bytes(payload[4:8], 'big')
                if spi not in result.esp_info.spis:
                    result.esp_info.spis.append(spi)
                result.esp_info.sequence_numbers.append(seq)

    def _process_ah_raw(self, pkt, result: ParseResult):
        """Process AH by raw IP protocol number."""
        result.stats.ah_packets += 1
        result.ah_info.packet_count += 1
