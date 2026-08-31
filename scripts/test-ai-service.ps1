# ===============================================================
# IPSEC-VPN - AI Service Direct Test Suite
# ===============================================================
# Tests the Python AI service directly (without Go backend)
# Usage: .\scripts\test-ai-service.ps1 [-BaseUrl "http://localhost:8000"]
# ===============================================================

param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$PcapDir = "$PSScriptRoot\..\data\pcaps"
)

$ErrorActionPreference = "Continue"
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "-------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "  $Title" -ForegroundColor DarkCyan
    Write-Host "-------------------------------------------" -ForegroundColor DarkCyan
}

function Test-AIEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$FilePath = "",
        [switch]$ReturnBody
    )

    $script:TotalTests++
    Write-Host "  [$Method] $Url - $Name" -ForegroundColor Yellow

    try {
        $params = @{
            Method = $Method
            Uri    = $Url
            UseBasicParsing = $true
        }

        if ($FilePath -ne "" -and (Test-Path $FilePath)) {
            $boundary = [System.Guid]::NewGuid().ToString()
            $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
            $fileName = [System.IO.Path]::GetFileName($FilePath)

            $bodyLines = @(
                "--$boundary",
                "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
                "Content-Type: application/octet-stream",
                "",
                ""
            )
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes(($bodyLines -join "`r`n"))
            $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")

            $bodyStream = New-Object System.IO.MemoryStream
            $bodyStream.Write($headerBytes, 0, $headerBytes.Length)
            $bodyStream.Write($fileBytes, 0, $fileBytes.Length)
            $bodyStream.Write($footerBytes, 0, $footerBytes.Length)

            $params["Body"] = $bodyStream.ToArray()
            $params["ContentType"] = "multipart/form-data; boundary=$boundary"
        }

        $response = Invoke-WebRequest @params -ErrorAction Stop

        if ($response.StatusCode -eq $ExpectedStatus) {
            $script:PassedTests++
            Write-Host "  PASS (Status: $($response.StatusCode))" -ForegroundColor Green
        }
        else {
            $script:FailedTests++
            Write-Host "  FAIL (Expected: $ExpectedStatus, Got: $($response.StatusCode))" -ForegroundColor Red
        }

        if ($ReturnBody) {
            return $response.Content | ConvertFrom-Json
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        if ($statusCode -eq $ExpectedStatus) {
            $script:PassedTests++
            Write-Host "  PASS (Status: $statusCode)" -ForegroundColor Green
        }
        else {
            $script:FailedTests++
            Write-Host "  FAIL (Error: $($_.Exception.Message))" -ForegroundColor Red
        }
    }
}

# 1. Health Check
Write-TestHeader "1. AI SERVICE HEALTH"
$health = Test-AIEndpoint -Name "Health check" -Method "GET" -Url "$BaseUrl/health" -ReturnBody
if ($health) {
    Write-Host "  Service: $($health.service), Version: $($health.version)" -ForegroundColor Gray
}

# 2. Model Info
Write-TestHeader "2. MODEL INFO"
$modelInfo = Test-AIEndpoint -Name "Model info" -Method "GET" -Url "$BaseUrl/models/info" -ReturnBody
if ($modelInfo) {
    Write-Host "  Model: $($modelInfo.model_version), Type: $($modelInfo.model_type)" -ForegroundColor Gray
    Write-Host "  Capabilities: $($modelInfo.capabilities -join ', ')" -ForegroundColor Gray
}

# 3. Analyze Strong PCAP
Write-TestHeader "3. ANALYZE STRONG IPSEC PCAP"
$strongPcap = Join-Path $PcapDir "strong-ipsec.pcap"
$strongResult = Test-AIEndpoint -Name "Full analysis - strong" -Method "POST" -Url "$BaseUrl/analyze" -FilePath $strongPcap -ReturnBody

if ($strongResult) {
    Write-Host ""
    Write-Host "  === Strong PCAP Results ===" -ForegroundColor Green
    Write-Host "  Protocol: $($strongResult.classification.protocol)" -ForegroundColor White
    Write-Host "  IKE Version: $($strongResult.classification.ike_version)" -ForegroundColor White
    Write-Host "  Encryption: $($strongResult.crypto_analysis.encryption.algorithm) ($($strongResult.crypto_analysis.encryption.strength))" -ForegroundColor White
    Write-Host "  Auth: $($strongResult.crypto_analysis.authentication.algorithm) ($($strongResult.crypto_analysis.authentication.strength))" -ForegroundColor White
    Write-Host "  DH Group: $($strongResult.crypto_analysis.dh_group.group_number) ($($strongResult.crypto_analysis.dh_group.strength))" -ForegroundColor White
    Write-Host "  PFS: $($strongResult.crypto_analysis.pfs.detected)" -ForegroundColor White
    Write-Host "  Risk Score: $($strongResult.security_assessment.risk_score)" -ForegroundColor Green
    Write-Host "  Severity: $($strongResult.security_assessment.severity)" -ForegroundColor Green
    Write-Host "  Findings: $($strongResult.security_assessment.findings.Count)" -ForegroundColor White
    Write-Host "  Confidence: $($strongResult.confidence.overall_score)" -ForegroundColor White

    # Validate risk is LOW
    $script:TotalTests++
    if ($strongResult.security_assessment.risk_score -le 25) {
        $script:PassedTests++
        Write-Host "  PASS: Strong PCAP scored LOW risk ($($strongResult.security_assessment.risk_score))" -ForegroundColor Green
    } else {
        $script:FailedTests++
        Write-Host "  FAIL: Strong PCAP should be LOW risk, got $($strongResult.security_assessment.risk_score)" -ForegroundColor Red
    }
}

# 4. Analyze Weak PCAP
Write-TestHeader "4. ANALYZE WEAK IPSEC PCAP"
$weakPcap = Join-Path $PcapDir "weak-ipsec.pcap"
$weakResult = Test-AIEndpoint -Name "Full analysis - weak" -Method "POST" -Url "$BaseUrl/analyze" -FilePath $weakPcap -ReturnBody

if ($weakResult) {
    Write-Host ""
    Write-Host "  === Weak PCAP Results ===" -ForegroundColor Red
    Write-Host "  Protocol: $($weakResult.classification.protocol)" -ForegroundColor White
    Write-Host "  IKE Version: $($weakResult.classification.ike_version)" -ForegroundColor White
    Write-Host "  Encryption: $($weakResult.crypto_analysis.encryption.algorithm) ($($weakResult.crypto_analysis.encryption.strength))" -ForegroundColor White
    Write-Host "  Auth: $($weakResult.crypto_analysis.authentication.algorithm) ($($weakResult.crypto_analysis.authentication.strength))" -ForegroundColor White
    Write-Host "  DH Group: $($weakResult.crypto_analysis.dh_group.group_number) ($($weakResult.crypto_analysis.dh_group.strength))" -ForegroundColor White
    Write-Host "  PFS: $($weakResult.crypto_analysis.pfs.detected)" -ForegroundColor White
    Write-Host "  Risk Score: $($weakResult.security_assessment.risk_score)" -ForegroundColor Red
    Write-Host "  Severity: $($weakResult.security_assessment.severity)" -ForegroundColor Red
    Write-Host "  Findings: $($weakResult.security_assessment.findings.Count)" -ForegroundColor White

    # Validate risk is HIGH or CRITICAL
    $script:TotalTests++
    if ($weakResult.security_assessment.risk_score -gt 50) {
        $script:PassedTests++
        Write-Host "  PASS: Weak PCAP scored HIGH/CRITICAL risk ($($weakResult.security_assessment.risk_score))" -ForegroundColor Green
    } else {
        $script:FailedTests++
        Write-Host "  FAIL: Weak PCAP should be HIGH+ risk, got $($weakResult.security_assessment.risk_score)" -ForegroundColor Red
    }

    # Contrast test
    if ($strongResult) {
        $script:TotalTests++
        if ($weakResult.security_assessment.risk_score -gt $strongResult.security_assessment.risk_score) {
            $script:PassedTests++
            Write-Host "  PASS: Weak risk ($($weakResult.security_assessment.risk_score)) > Strong risk ($($strongResult.security_assessment.risk_score))" -ForegroundColor Green
        } else {
            $script:FailedTests++
            Write-Host "  FAIL: Weak should score higher than Strong" -ForegroundColor Red
        }
    }
}

# 5. Analyze Non-IPsec PCAP
Write-TestHeader "5. ANALYZE NON-IPSEC PCAP"
$nonIpsecPcap = Join-Path $PcapDir "non-ipsec.pcap"
$nonResult = Test-AIEndpoint -Name "Full analysis - non-IPsec" -Method "POST" -Url "$BaseUrl/analyze" -FilePath $nonIpsecPcap -ReturnBody

if ($nonResult) {
    Write-Host "  Protocol: $($nonResult.classification.protocol)" -ForegroundColor White
    Write-Host "  Confidence: $($nonResult.confidence.overall_score)" -ForegroundColor White

    $script:TotalTests++
    if ($nonResult.classification.protocol -eq "Non-IPsec") {
        $script:PassedTests++
        Write-Host "  PASS: Correctly identified as Non-IPsec" -ForegroundColor Green
    } else {
        $script:FailedTests++
        Write-Host "  FAIL: Should be Non-IPsec, got $($nonResult.classification.protocol)" -ForegroundColor Red
    }
}

# 6. Classification-Only Endpoint
Write-TestHeader "6. CLASSIFY-ONLY ENDPOINT"
Test-AIEndpoint -Name "Classify strong PCAP" -Method "POST" -Url "$BaseUrl/classify" -FilePath $strongPcap

# 7. Security-Assess-Only Endpoint
Write-TestHeader "7. SECURITY-ASSESS ENDPOINT"
Test-AIEndpoint -Name "Assess strong PCAP" -Method "POST" -Url "$BaseUrl/security-assess" -FilePath $strongPcap

# Summary
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  AI SERVICE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Total:  $TotalTests" -ForegroundColor White
Write-Host "  Passed: $PassedTests" -ForegroundColor Green
Write-Host "  Failed: $FailedTests" -ForegroundColor Red
Write-Host ""

if ($FailedTests -eq 0) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  $FailedTests TEST(S) FAILED" -ForegroundColor Red
}

Write-Host ""
exit $FailedTests
