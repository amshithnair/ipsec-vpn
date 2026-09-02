import type { FullAnalysis, Classification } from '../types';

// ── cap-001: Strong IPsec → LOW risk ───────────────────────
export const analysisMockStrong: FullAnalysis = {
  capture: {
    id: 'cap-001',
    filename: 'strong-ipsec.pcap',
    file_size: 204800,
    status: 'completed',
    created_at: '2026-08-31T18:20:00Z',
    analyzed_at: '2026-08-31T18:22:10Z',
    source: 'manual-upload',
    capture_start: '2026-08-31T18:19:45Z',
    capture_end: '2026-08-31T18:19:58Z',
    duration_seconds: 13,
    packet_count: 342,
  },
  classification: {
    protocol: 'IPsec',
    protocol_confidence: 0.99,
    ike_version: 'IKEv2',
    mode: 'tunnel',
    encryption_algo: 'AES-256-GCM',
    auth_algo: 'SHA-256',
    dh_group: 20,
    pfs_detected: true,
    replay_protection: true,
    sa_lifetime_seconds: 3600,
    confidence_score: 0.97,
  },
  security: {
    risk_score: 18,
    severity: 'LOW',
    crypto_strength_score: 92,
    ai_confidence_score: 0.96,
    findings: [
      {
        id: 'find-001-a',
        title: 'SA Lifetime Within Acceptable Range',
        severity: 'LOW',
        explanation: 'SA lifetime is set to 3600 seconds (1 hour), which is within recommended operational bounds.',
        impact: 'Minimal. Short lifetimes limit the window of exposure if a session key is compromised.',
      },
    ],
    recommendations: [
      {
        id: 'rec-001-a',
        title: 'Consider reducing SA lifetime to 1800s for high-security environments',
        description: 'While 3600s is acceptable, reducing to 1800s further limits key exposure windows in critical infrastructure deployments.',
        priority: 'LOW',
      },
    ],
    compliance_baseline: [
      { name: 'NIST SP 800-77 Rev 1', pass: true, details: 'AES-256-GCM and SHA-256 with DH Group 20 satisfy NIST requirements.' },
      { name: 'BSI TR-02102-3',       pass: true, details: 'Configuration meets BSI technical guideline for IPsec.' },
    ],
  },
};

// ── cap-002: Weak crypto DES → CRITICAL risk ───────────────
export const analysisMockCritical: FullAnalysis = {
  capture: {
    id: 'cap-002',
    filename: 'weak-crypto-des.pcap',
    file_size: 98304,
    status: 'completed',
    created_at: '2026-08-31T14:00:00Z',
    analyzed_at: '2026-08-31T14:05:33Z',
    source: 'manual-upload',
    capture_start: '2026-08-31T13:59:30Z',
    capture_end: '2026-08-31T14:00:10Z',
    duration_seconds: 40,
    packet_count: 187,
  },
  classification: {
    protocol: 'IPsec',
    protocol_confidence: 0.98,
    ike_version: 'IKEv1',
    mode: 'transport',
    encryption_algo: 'DES',
    auth_algo: 'MD5',
    dh_group: 1,
    pfs_detected: false,
    replay_protection: false,
    sa_lifetime_seconds: 86400,
    confidence_score: 0.95,
  },
  security: {
    risk_score: 89,
    severity: 'CRITICAL',
    crypto_strength_score: 8,
    ai_confidence_score: 0.97,
    findings: [
      {
        id: 'find-002-a',
        title: 'DES Encryption Detected — Cryptographically Broken',
        severity: 'CRITICAL',
        explanation: 'DES (56-bit key) is considered cryptographically broken. It can be brute-forced in under 24 hours with commodity hardware.',
        impact: 'VPN traffic is effectively unencrypted against a determined attacker. All session data is at risk of decryption.',
        cve: 'CVE-2016-2183',
      },
      {
        id: 'find-002-b',
        title: 'MD5 Authentication — Collision Vulnerability',
        severity: 'CRITICAL',
        explanation: 'MD5 is vulnerable to collision attacks and is not suitable for use in HMAC-based authentication in IPsec.',
        impact: 'Authentication integrity may be compromised, enabling message forgery or replay attacks.',
      },
      {
        id: 'find-002-c',
        title: 'IKEv1 Protocol Deprecated',
        severity: 'HIGH',
        explanation: 'IKEv1 lacks the security improvements of IKEv2 including better authentication, DoS resistance, and EAP support.',
        impact: 'Exposure to aggressive mode fingerprinting, pre-shared key attacks, and missing MOBIKE support.',
      },
      {
        id: 'find-002-d',
        title: 'Perfect Forward Secrecy (PFS) Disabled',
        severity: 'HIGH',
        explanation: 'Without PFS, compromise of the long-term key exposes all past and future session keys.',
        impact: 'A single key compromise allows retroactive decryption of all previously recorded sessions.',
      },
      {
        id: 'find-002-e',
        title: 'Replay Protection Disabled',
        severity: 'MEDIUM',
        explanation: 'Anti-replay protection is not configured. Captured packets can be replayed by an attacker to repeat authenticated actions.',
        impact: 'Susceptibility to replay attacks targeting authenticated VPN sessions.',
      },
      {
        id: 'find-002-f',
        title: 'Diffie-Hellman Group 1 (768-bit MODP) — Insufficient',
        severity: 'CRITICAL',
        explanation: 'DH Group 1 uses a 768-bit MODP group, which is below the NIST-recommended minimum of 2048-bit and is practically factorable.',
        impact: 'Session key agreement can be broken, enabling passive decryption of the entire session.',
      },
      {
        id: 'find-002-g',
        title: 'Excessive SA Lifetime (86400 seconds)',
        severity: 'MEDIUM',
        explanation: 'An SA lifetime of 24 hours is excessive. Extended lifetimes prolong key exposure and increase the blast radius of a compromise.',
        impact: 'Compromised session keys remain valid for 24 hours, maximising decryption window.',
      },
    ],
    recommendations: [
      {
        id: 'rec-002-a',
        title: 'Replace DES with AES-256-GCM immediately',
        description: 'DES must be replaced with AES-256-GCM (AEAD cipher providing confidentiality and integrity). This is a P0 remediation item.',
        priority: 'CRITICAL',
      },
      {
        id: 'rec-002-b',
        title: 'Replace MD5 with SHA-256 or SHA-384',
        description: 'Migrate to HMAC-SHA-256 or HMAC-SHA-384 for integrity protection. MD5 must not be used in any security-sensitive context.',
        priority: 'CRITICAL',
      },
      {
        id: 'rec-002-c',
        title: 'Migrate from IKEv1 to IKEv2',
        description: 'IKEv1 is deprecated in RFC 9395. Upgrade to IKEv2 to obtain DoS resilience, EAP authentication, MOBIKE, and improved key exchange.',
        priority: 'HIGH',
      },
      {
        id: 'rec-002-d',
        title: 'Enable Perfect Forward Secrecy',
        description: 'Configure PFS using DH Group 19 (ECDH P-256) or Group 20 (ECDH P-384) to ensure session key independence.',
        priority: 'HIGH',
      },
      {
        id: 'rec-002-e',
        title: 'Enable anti-replay protection',
        description: 'Enable the ESP anti-replay window (recommended size: 64 or 128 packets) to prevent replay attacks.',
        priority: 'MEDIUM',
      },
      {
        id: 'rec-002-f',
        title: 'Upgrade DH Group to 19 or 20 (ECDH)',
        description: 'Replace DH Group 1 with ECDH Group 19 (P-256) or Group 20 (P-384) for quantum-resistant key exchange.',
        priority: 'CRITICAL',
      },
      {
        id: 'rec-002-g',
        title: 'Reduce SA lifetime to 3600 seconds or less',
        description: 'Set Phase 1 SA lifetime to 86400s max and Phase 2 to 3600s max. Consider 1800s for high-security deployments.',
        priority: 'MEDIUM',
      },
    ],
    compliance_baseline: [
      { name: 'NIST SP 800-77 Rev 1', pass: false, details: 'DES, MD5, and DH Group 1 are all prohibited under NIST guidelines.' },
      { name: 'BSI TR-02102-3',       pass: false, details: 'Configuration fails BSI minimum requirements for encryption and key exchange.' },
      { name: 'PCI DSS v4.0',         pass: false, details: 'DES and MD5 are not permitted under PCI DSS 4.0 cryptographic requirements.' },
    ],
    threat_matrix: [
      { threat: 'Passive decryption of VPN traffic', likelihood: 'HIGH', impact: 'HIGH', mitigation: 'Replace DES with AES-256-GCM' },
      { threat: 'Brute-force DH Group 1 key exchange', likelihood: 'HIGH', impact: 'HIGH', mitigation: 'Migrate to ECDH Group 19/20' },
      { threat: 'Replay attack via captured packets', likelihood: 'MEDIUM', impact: 'MEDIUM', mitigation: 'Enable anti-replay window' },
      { threat: 'Retroactive decryption after key compromise', likelihood: 'HIGH', impact: 'HIGH', mitigation: 'Enable PFS' },
    ],
  },
};

// ── cap-003: Weak DH Group → HIGH risk ─────────────────────
export const analysisMockWeakDH: FullAnalysis = {
  capture: {
    id: 'cap-003',
    filename: 'weak-dh-group1.pcap',
    file_size: 153600,
    status: 'completed',
    created_at: '2026-08-30T09:40:00Z',
    analyzed_at: '2026-08-30T09:45:12Z',
    source: 'manual-upload',
    capture_start: '2026-08-30T09:39:10Z',
    capture_end: '2026-08-30T09:39:55Z',
    duration_seconds: 45,
    packet_count: 256,
  },
  classification: {
    protocol: 'IPsec',
    protocol_confidence: 0.97,
    ike_version: 'IKEv2',
    mode: 'tunnel',
    encryption_algo: 'AES-128',
    auth_algo: 'SHA-1',
    dh_group: 2,
    pfs_detected: true,
    replay_protection: true,
    sa_lifetime_seconds: 28800,
    confidence_score: 0.96,
  },
  security: {
    risk_score: 71,
    severity: 'HIGH',
    crypto_strength_score: 45,
    ai_confidence_score: 0.94,
    findings: [
      {
        id: 'find-003-a',
        title: 'DH Group 2 (1024-bit MODP) — Below Minimum Security Threshold',
        severity: 'HIGH',
        explanation: 'DH Group 2 uses a 1024-bit MODP group, below the NIST-recommended 2048-bit minimum. Known to be factorable by nation-state adversaries.',
        impact: 'Session key exchange may be broken by well-resourced attackers enabling passive session decryption.',
      },
      {
        id: 'find-003-b',
        title: 'SHA-1 Authentication Hash — Deprecated',
        severity: 'HIGH',
        explanation: 'SHA-1 has been deprecated by NIST since 2011 and is vulnerable to chosen-prefix collision attacks.',
        impact: 'Authentication integrity weakened. SHA-1 collision attacks may enable certificate forgery in certain configurations.',
      },
      {
        id: 'find-003-c',
        title: 'AES-128 — Below Recommended Key Length for Long-Term Security',
        severity: 'MEDIUM',
        explanation: 'While AES-128 remains secure today, NIST recommends AES-256 for data requiring long-term confidentiality protection.',
        impact: 'Reduced long-term security margin. May be insufficient for highly classified data.',
      },
    ],
    recommendations: [
      {
        id: 'rec-003-a',
        title: 'Upgrade DH Group to 14 (2048-bit MODP) at minimum, prefer Group 19 or 20',
        description: 'DH Group 2 must be replaced. DH Group 14 is the minimum acceptable; ECDH Groups 19/20 are preferred for performance and security.',
        priority: 'HIGH',
      },
      {
        id: 'rec-003-b',
        title: 'Replace SHA-1 with SHA-256 or SHA-384',
        description: 'Migrate PRF and integrity algorithms from SHA-1 to SHA-256 minimum. SHA-384 preferred for high-assurance environments.',
        priority: 'HIGH',
      },
      {
        id: 'rec-003-c',
        title: 'Upgrade encryption to AES-256-GCM',
        description: 'Consider migrating to AES-256-GCM for combined confidentiality and integrity (AEAD) and increased key strength.',
        priority: 'MEDIUM',
      },
    ],
    compliance_baseline: [
      { name: 'NIST SP 800-77 Rev 1', pass: false, details: 'DH Group 2 and SHA-1 are not compliant with current NIST recommendations.' },
      { name: 'BSI TR-02102-3',       pass: false, details: 'SHA-1 is explicitly prohibited under BSI TR-02102-3 (2024).' },
    ],
  },
};

// ── cap-004: IKEv1 → MEDIUM risk ───────────────────────────
export const analysisMockIKEv1: FullAnalysis = {
  capture: {
    id: 'cap-004',
    filename: 'ikev1-main-mode.pcap',
    file_size: 77824,
    status: 'completed',
    created_at: '2026-08-29T22:08:00Z',
    analyzed_at: '2026-08-29T22:10:05Z',
    source: 'manual-upload',
    capture_start: '2026-08-29T22:07:20Z',
    capture_end: '2026-08-29T22:07:55Z',
    duration_seconds: 35,
    packet_count: 124,
  },
  classification: {
    protocol: 'IPsec',
    protocol_confidence: 0.96,
    ike_version: 'IKEv1',
    mode: 'tunnel',
    encryption_algo: 'AES-256',
    auth_algo: 'SHA-256',
    dh_group: 14,
    pfs_detected: false,
    replay_protection: true,
    sa_lifetime_seconds: 28800,
    confidence_score: 0.93,
  },
  security: {
    risk_score: 55,
    severity: 'MEDIUM',
    crypto_strength_score: 62,
    ai_confidence_score: 0.91,
    findings: [
      {
        id: 'find-004-a',
        title: 'IKEv1 Protocol In Use — Deprecated',
        severity: 'HIGH',
        explanation: 'IKEv1 is deprecated per RFC 9395 (2023). It lacks IKEv2 security features including improved DoS resistance and EAP support.',
        impact: 'Susceptibility to IKEv1-specific attacks including aggressive mode fingerprinting and implementation-specific vulnerabilities.',
      },
      {
        id: 'find-004-b',
        title: 'Perfect Forward Secrecy (PFS) Not Enabled',
        severity: 'MEDIUM',
        explanation: 'PFS is not configured for Phase 2. Session keys are derived from the Phase 1 master key without independent rekeying.',
        impact: 'Compromise of long-term credentials exposes all past and future Phase 2 session keys.',
      },
    ],
    recommendations: [
      {
        id: 'rec-004-a',
        title: 'Migrate from IKEv1 to IKEv2',
        description: 'Upgrade to IKEv2 to eliminate IKEv1 deprecation risk and gain improved resilience, EAP support, and MOBIKE.',
        priority: 'HIGH',
      },
      {
        id: 'rec-004-b',
        title: 'Enable PFS with DH Group 19 or 20',
        description: 'Configure PFS for Phase 2 using ECDH Group 19 (P-256) or Group 20 (P-384) to ensure session key independence.',
        priority: 'MEDIUM',
      },
    ],
    compliance_baseline: [
      { name: 'NIST SP 800-77 Rev 1', pass: false, details: 'IKEv1 is deprecated; NIST recommends IKEv2 exclusively.' },
      { name: 'BSI TR-02102-3',       pass: false, details: 'IKEv1 is not permitted under BSI TR-02102-3 (2024).' },
    ],
  },
};

// ── cap-005: Non-IPsec → no IPsec data ─────────────────────
export const analysisMockNonIPsec: FullAnalysis = {
  capture: {
    id: 'cap-005',
    filename: 'non-ipsec-http.pcap',
    file_size: 45056,
    status: 'completed',
    created_at: '2026-08-29T11:28:00Z',
    analyzed_at: '2026-08-29T11:30:00Z',
    source: 'manual-upload',
    capture_start: '2026-08-29T11:27:40Z',
    capture_end: '2026-08-29T11:27:58Z',
    duration_seconds: 18,
    packet_count: 89,
  },
  classification: {
    protocol: 'HTTP',
    protocol_confidence: 0.94,
    ike_version: null,
    mode: null,
    encryption_algo: null,
    auth_algo: null,
    dh_group: null,
    pfs_detected: null,
    replay_protection: null,
    sa_lifetime_seconds: null,
    confidence_score: 0.94,
  },
  security: {
    risk_score: 0,
    severity: 'LOW',
    crypto_strength_score: 0,
    ai_confidence_score: 0.94,
    findings: [],
    recommendations: [],
  },
};

// ── cap-006: PFS disabled → HIGH risk ──────────────────────
export const analysisMockPFSDisabled: FullAnalysis = {
  capture: {
    id: 'cap-006',
    filename: 'pfs-disabled-aes256.pcap',
    file_size: 122880,
    status: 'completed',
    created_at: '2026-08-28T16:50:00Z',
    analyzed_at: '2026-08-28T16:55:44Z',
    source: 'manual-upload',
    capture_start: '2026-08-28T16:49:22Z',
    capture_end: '2026-08-28T16:49:58Z',
    duration_seconds: 36,
    packet_count: 201,
  },
  classification: {
    protocol: 'IPsec',
    protocol_confidence: 0.98,
    ike_version: 'IKEv2',
    mode: 'tunnel',
    encryption_algo: 'AES-256',
    auth_algo: 'SHA-256',
    dh_group: 14,
    pfs_detected: false,
    replay_protection: true,
    sa_lifetime_seconds: 14400,
    confidence_score: 0.96,
  },
  security: {
    risk_score: 62,
    severity: 'HIGH',
    crypto_strength_score: 58,
    ai_confidence_score: 0.95,
    findings: [
      {
        id: 'find-006-a',
        title: 'Perfect Forward Secrecy (PFS) Disabled',
        severity: 'HIGH',
        explanation: 'PFS is not negotiated in Phase 2. Without PFS, Child SA keys are derived from Phase 1 keying material without fresh DH exchange.',
        impact: 'Compromise of Phase 1 long-term keys enables decryption of all Phase 2 Child SA traffic, past and future.',
      },
    ],
    recommendations: [
      {
        id: 'rec-006-a',
        title: 'Enable PFS on all Child SAs using DH Group 19 or 20',
        description: 'Configure PFS for all IPsec Child SAs. Use ECDH Group 19 (P-256) or Group 20 (P-384) for optimal security and performance.',
        priority: 'HIGH',
      },
    ],
    compliance_baseline: [
      { name: 'NIST SP 800-77 Rev 1', pass: false, details: 'NIST recommends PFS for all IPsec Phase 2 negotiations.' },
    ],
  },
};

// ── Map of all analysis mocks by capture ID ─────────────────
export const analysisMockMap: Record<string, FullAnalysis> = {
  'cap-001': analysisMockStrong,
  'cap-002': analysisMockCritical,
  'cap-003': analysisMockWeakDH,
  'cap-004': analysisMockIKEv1,
  'cap-005': analysisMockNonIPsec,
  'cap-006': analysisMockPFSDisabled,
};

// ── Individual classification exports ──────────────────────
export const classificationMockMap: Record<string, Classification> = Object.fromEntries(
  Object.entries(analysisMockMap).map(([id, a]) => [id, a.classification])
);
