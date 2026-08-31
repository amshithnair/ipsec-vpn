"""
Security Rules Engine — YAML-driven deterministic security scoring.

Loads rules from security-rules.yaml and evaluates IPsec configurations
to produce risk scores, severity classifications, findings, and recommendations.
"""

from __future__ import annotations

import os
from typing import Optional

import yaml

from app.models.schemas import (
    ClassificationResult,
    CryptoAnalysis,
    SecurityAssessment,
    Finding,
    Recommendation,
)


class RulesEngine:
    """
    Deterministic security rules engine.
    Evaluates cryptographic parameters against a YAML ruleset
    and produces a 0-100 risk score with findings.
    """

    def __init__(self, rules_path: str):
        self.rules_path = rules_path
        self.rules = {}
        self.version = "rules-v1"
        self._load_rules()

    def _load_rules(self):
        """Load rules from YAML file."""
        if not os.path.exists(self.rules_path):
            print(f"[RulesEngine] WARNING: Rules file not found at {self.rules_path}, using defaults")
            self.rules = self._default_rules()
            return

        with open(self.rules_path, "r") as f:
            self.rules = yaml.safe_load(f) or {}

        self.version = self.rules.get("version", "rules-v1")
        print(f"[RulesEngine] Loaded rules version: {self.version}")

    def _default_rules(self) -> dict:
        """Minimal fallback rules if YAML not found."""
        return {
            "version": "rules-v1-default",
            "severity_thresholds": {"low": 25, "medium": 50, "high": 75, "critical": 100},
            "scoring_weights": {
                "encryption": 0.30,
                "authentication": 0.25,
                "key_exchange": 0.20,
                "protocol": 0.15,
                "configuration": 0.10,
            },
        }

    def evaluate(
        self,
        classification: ClassificationResult,
        crypto: CryptoAnalysis,
        replay_protection: Optional[bool] = None,
    ) -> SecurityAssessment:
        """
        Evaluate the classification and crypto analysis against the rules.
        Returns a complete SecurityAssessment.
        """
        findings: list[Finding] = []
        recommendations: list[Recommendation] = []
        total_penalty = 0

        # ── Evaluate Encryption ──
        enc_penalty, enc_findings, enc_recs = self._evaluate_encryption(crypto.encryption.algorithm)
        total_penalty += enc_penalty
        findings.extend(enc_findings)
        recommendations.extend(enc_recs)

        # ── Evaluate Authentication ──
        auth_penalty, auth_findings, auth_recs = self._evaluate_authentication(crypto.authentication.algorithm)
        total_penalty += auth_penalty
        findings.extend(auth_findings)
        recommendations.extend(auth_recs)

        # ── Evaluate Key Exchange (DH Group) ──
        if crypto.dh_group.group_number is not None:
            ke_penalty, ke_findings, ke_recs = self._evaluate_key_exchange(crypto.dh_group.group_number)
            total_penalty += ke_penalty
            findings.extend(ke_findings)
            recommendations.extend(ke_recs)

        # ── Evaluate Protocol Version ──
        if classification.ike_version:
            proto_penalty, proto_findings, proto_recs = self._evaluate_protocol(classification.ike_version)
            total_penalty += proto_penalty
            findings.extend(proto_findings)
            recommendations.extend(proto_recs)

        # ── Evaluate Configuration ──
        cfg_penalty, cfg_findings, cfg_recs = self._evaluate_configuration(
            crypto.pfs.detected, replay_protection
        )
        total_penalty += cfg_penalty
        findings.extend(cfg_findings)
        recommendations.extend(cfg_recs)

        # ── Calculate final scores ──
        risk_score = min(max(int(total_penalty), 0), 100)
        severity = self._score_to_severity(risk_score)
        crypto_strength = max(0, 100 - risk_score)

        return SecurityAssessment(
            risk_score=risk_score,
            severity=severity,
            crypto_strength_score=crypto_strength,
            findings=findings,
            recommendations=recommendations,
        )

    def _evaluate_encryption(self, algorithm: str) -> tuple[int, list[Finding], list[Recommendation]]:
        """Evaluate encryption algorithm against rules."""
        findings = []
        recommendations = []
        penalty = 0

        rules = self.rules.get("encryption_rules", [])
        algo_upper = algorithm.upper()

        matched = False
        for rule in rules:
            condition = rule.get("condition", {})
            matches = condition.get("algorithm_match", [])
            for match in matches:
                if match.upper() in algo_upper or algo_upper in match.upper():
                    penalty += rule.get("penalty", 0)
                    finding = rule.get("finding", {})
                    findings.append(Finding(
                        id=rule["id"],
                        category=rule.get("category", "encryption"),
                        severity=rule.get("severity", "INFO"),
                        title=finding.get("title", ""),
                        description=finding.get("description", ""),
                        evidence={"field": "encryption", "value": algorithm},
                        recommendation=finding.get("title", ""),
                    ))
                    rec = rule.get("recommendation", {})
                    if rec and rule.get("penalty", 0) > 0:
                        recommendations.append(Recommendation(
                            id=f"R-{rule['id']}",
                            priority=rec.get("priority", "MEDIUM"),
                            category="encryption",
                            title=rec.get("title", ""),
                            description=finding.get("description", ""),
                            action=rec.get("action", ""),
                        ))
                    matched = True
                    break
            if matched:
                break

        if not matched and algorithm != "Unknown":
            findings.append(Finding(
                id="ENC-UNKNOWN",
                category="encryption",
                severity="MEDIUM",
                title=f"Unrecognized encryption: {algorithm}",
                description=f"The encryption algorithm '{algorithm}' is not in the rules database.",
                evidence={"field": "encryption", "value": algorithm},
                recommendation="Verify this algorithm meets security requirements",
            ))
            penalty += 10

        return penalty, findings, recommendations

    def _evaluate_authentication(self, algorithm: str) -> tuple[int, list[Finding], list[Recommendation]]:
        """Evaluate authentication algorithm against rules."""
        findings = []
        recommendations = []
        penalty = 0

        rules = self.rules.get("authentication_rules", [])
        algo_upper = algorithm.upper()

        matched = False
        for rule in rules:
            condition = rule.get("condition", {})
            matches = condition.get("algorithm_match", [])
            for match in matches:
                if match.upper() in algo_upper or algo_upper in match.upper():
                    penalty += rule.get("penalty", 0)
                    finding = rule.get("finding", {})
                    findings.append(Finding(
                        id=rule["id"],
                        category=rule.get("category", "authentication"),
                        severity=rule.get("severity", "INFO"),
                        title=finding.get("title", ""),
                        description=finding.get("description", ""),
                        evidence={"field": "authentication", "value": algorithm},
                        recommendation=finding.get("title", ""),
                    ))
                    rec = rule.get("recommendation", {})
                    if rec and rule.get("penalty", 0) > 0:
                        recommendations.append(Recommendation(
                            id=f"R-{rule['id']}",
                            priority=rec.get("priority", "MEDIUM"),
                            category="authentication",
                            title=rec.get("title", ""),
                            description=finding.get("description", ""),
                            action=rec.get("action", ""),
                        ))
                    matched = True
                    break
            if matched:
                break

        return penalty, findings, recommendations

    def _evaluate_key_exchange(self, dh_group: int) -> tuple[int, list[Finding], list[Recommendation]]:
        """Evaluate DH group against rules."""
        findings = []
        recommendations = []
        penalty = 0

        rules = self.rules.get("key_exchange_rules", [])

        matched = False
        for rule in rules:
            condition = rule.get("condition", {})

            # Check exact group match
            if "dh_group" in condition and condition["dh_group"] == dh_group:
                matched = True
            # Check range match
            elif "dh_group_range" in condition:
                low, high = condition["dh_group_range"]
                if low <= dh_group <= high:
                    matched = True

            if matched:
                penalty += rule.get("penalty", 0)
                finding = rule.get("finding", {})
                findings.append(Finding(
                    id=rule["id"],
                    category=rule.get("category", "key_exchange"),
                    severity=rule.get("severity", "INFO"),
                    title=finding.get("title", ""),
                    description=finding.get("description", ""),
                    evidence={"field": "dh_group", "value": dh_group},
                    recommendation=finding.get("title", ""),
                ))
                rec = rule.get("recommendation", {})
                if rec and rule.get("penalty", 0) > 0:
                    recommendations.append(Recommendation(
                        id=f"R-{rule['id']}",
                        priority=rec.get("priority", "MEDIUM"),
                        category="key_exchange",
                        title=rec.get("title", ""),
                        description=finding.get("description", ""),
                        action=rec.get("action", ""),
                    ))
                break

        return penalty, findings, recommendations

    def _evaluate_protocol(self, ike_version: str) -> tuple[int, list[Finding], list[Recommendation]]:
        """Evaluate IKE protocol version against rules."""
        findings = []
        recommendations = []
        penalty = 0

        rules = self.rules.get("protocol_rules", [])

        for rule in rules:
            condition = rule.get("condition", {})
            if condition.get("ike_version") == ike_version:
                penalty += rule.get("penalty", 0)
                finding = rule.get("finding", {})
                findings.append(Finding(
                    id=rule["id"],
                    category=rule.get("category", "protocol"),
                    severity=rule.get("severity", "INFO"),
                    title=finding.get("title", ""),
                    description=finding.get("description", ""),
                    evidence={"field": "ike_version", "value": ike_version},
                    recommendation=finding.get("title", ""),
                ))
                rec = rule.get("recommendation", {})
                if rec and rule.get("penalty", 0) > 0:
                    recommendations.append(Recommendation(
                        id=f"R-{rule['id']}",
                        priority=rec.get("priority", "MEDIUM"),
                        category="protocol",
                        title=rec.get("title", ""),
                        description=finding.get("description", ""),
                        action=rec.get("action", ""),
                    ))
                break

        return penalty, findings, recommendations

    def _evaluate_configuration(
        self, pfs_detected: bool, replay_protection: Optional[bool]
    ) -> tuple[int, list[Finding], list[Recommendation]]:
        """Evaluate configuration parameters (PFS, replay protection)."""
        findings = []
        recommendations = []
        penalty = 0

        rules = self.rules.get("configuration_rules", [])

        for rule in rules:
            condition = rule.get("condition", {})

            if "pfs_detected" in condition and condition["pfs_detected"] == pfs_detected:
                penalty += rule.get("penalty", 0)
                finding = rule.get("finding", {})
                findings.append(Finding(
                    id=rule["id"],
                    category=rule.get("category", "configuration"),
                    severity=rule.get("severity", "INFO"),
                    title=finding.get("title", ""),
                    description=finding.get("description", ""),
                    evidence={"field": "pfs", "value": pfs_detected},
                    recommendation=finding.get("title", ""),
                ))
                rec = rule.get("recommendation", {})
                if rec and rule.get("penalty", 0) > 0:
                    recommendations.append(Recommendation(
                        id=f"R-{rule['id']}",
                        priority=rec.get("priority", "MEDIUM"),
                        category="configuration",
                        title=rec.get("title", ""),
                        description=finding.get("description", ""),
                        action=rec.get("action", ""),
                    ))

            if "replay_protection" in condition:
                rp = replay_protection if replay_protection is not None else False
                if condition["replay_protection"] == rp:
                    penalty += rule.get("penalty", 0)
                    finding = rule.get("finding", {})
                    findings.append(Finding(
                        id=rule["id"],
                        category=rule.get("category", "configuration"),
                        severity=rule.get("severity", "INFO"),
                        title=finding.get("title", ""),
                        description=finding.get("description", ""),
                        evidence={"field": "replay_protection", "value": rp},
                        recommendation=finding.get("title", ""),
                    ))
                    rec = rule.get("recommendation", {})
                    if rec and rule.get("penalty", 0) > 0:
                        recommendations.append(Recommendation(
                            id=f"R-{rule['id']}",
                            priority=rec.get("priority", "MEDIUM"),
                            category="configuration",
                            title=rec.get("title", ""),
                            description=finding.get("description", ""),
                            action=rec.get("action", ""),
                        ))

        return penalty, findings, recommendations

    def _score_to_severity(self, score: int) -> str:
        """Map risk score to severity label."""
        thresholds = self.rules.get("severity_thresholds", {})
        if score <= thresholds.get("low", 25):
            return "LOW"
        elif score <= thresholds.get("medium", 50):
            return "MEDIUM"
        elif score <= thresholds.get("high", 75):
            return "HIGH"
        else:
            return "CRITICAL"
