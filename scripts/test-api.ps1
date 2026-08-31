# ===============================================================
# IPSEC-VPN - PowerShell API Test Suite
# ===============================================================
# Usage: .\scripts\test-api.ps1 [-BaseUrl "http://localhost:8080"]
# ===============================================================

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AiServiceUrl = "http://localhost:8000",
    [string]$PcapDir = "$PSScriptRoot\..\data\pcaps"
)

$ErrorActionPreference = "Continue"
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0
$CaptureId = ""
$ReportId = ""

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [string]$Body = "",
        [string]$ContentType = "application/json",
        [string]$FilePath = "",
        [switch]$ReturnBody
    )

    $script:TotalTests++
    Write-Host ""
    Write-Host "  [$Method] $Url" -ForegroundColor Yellow
    Write-Host "  Test: $Name" -ForegroundColor Gray

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
        elseif ($Body -ne "") {
            $params["Body"] = $Body
            $params["ContentType"] = $ContentType
        }

        $response = Invoke-WebRequest @params -ErrorAction Stop
        $statusCode = $response.StatusCode

        if ($statusCode -eq $ExpectedStatus) {
            $script:PassedTests++
            Write-Host "  PASS (Status: $statusCode)" -ForegroundColor Green
        }
        else {
            $script:FailedTests++
            Write-Host "  FAIL (Expected: $ExpectedStatus, Got: $statusCode)" -ForegroundColor Red
        }

        if ($ReturnBody) {
            return $response.Content | ConvertFrom-Json
        }
        return $null
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        if ($statusCode -eq $ExpectedStatus) {
            $script:PassedTests++
            Write-Host "  PASS (Status: $statusCode - expected error)" -ForegroundColor Green
        }
        else {
            $script:FailedTests++
            Write-Host "  FAIL (Expected: $ExpectedStatus, Got: $statusCode)" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $null
    }
}

# 1. HEALTH CHECKS
Write-TestHeader "1. HEALTH CHECKS"

Test-Endpoint -Name "Backend health check" `
    -Method "GET" `
    -Url "$BaseUrl/api/v1/health" `
    -ExpectedStatus 200

Test-Endpoint -Name "AI Service health check" `
    -Method "GET" `
    -Url "$AiServiceUrl/health" `
    -ExpectedStatus 200

# 2. PCAP UPLOAD
Write-TestHeader "2. PCAP UPLOAD"

$strongPcap = Join-Path $PcapDir "strong-ipsec.pcap"
$weakPcap = Join-Path $PcapDir "weak-ipsec.pcap"

$uploadResult = Test-Endpoint -Name "Upload strong-ipsec.pcap" `
    -Method "POST" `
    -Url "$BaseUrl/api/v1/captures/upload" `
    -ExpectedStatus 201 `
    -FilePath $strongPcap `
    -ReturnBody

if ($uploadResult) {
    $script:CaptureId = $uploadResult.id
    Write-Host "  Capture ID: $($script:CaptureId)" -ForegroundColor Magenta
}

$weakUploadResult = Test-Endpoint -Name "Upload weak-ipsec.pcap" `
    -Method "POST" `
    -Url "$BaseUrl/api/v1/captures/upload" `
    -ExpectedStatus 201 `
    -FilePath $weakPcap `
    -ReturnBody

$WeakCaptureId = ""
if ($weakUploadResult) {
    $WeakCaptureId = $weakUploadResult.id
    Write-Host "  Weak Capture ID: $WeakCaptureId" -ForegroundColor Magenta
}

# 3. UPLOAD VALIDATION
Write-TestHeader "3. UPLOAD VALIDATION"

Test-Endpoint -Name "Upload without file (should fail)" `
    -Method "POST" `
    -Url "$BaseUrl/api/v1/captures/upload" `
    -ExpectedStatus 400

# 4. LIST & GET CAPTURES
Write-TestHeader "4. LIST & GET CAPTURES"

Test-Endpoint -Name "List all captures" `
    -Method "GET" `
    -Url "$BaseUrl/api/v1/captures" `
    -ExpectedStatus 200

if ($script:CaptureId -ne "") {
    $captureDetail = Test-Endpoint -Name "Get capture details" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/captures/$($script:CaptureId)" `
        -ExpectedStatus 200 `
        -ReturnBody

    if ($captureDetail) {
        Write-Host "  Filename: $($captureDetail.filename)" -ForegroundColor Gray
        Write-Host "  Status: $($captureDetail.status)" -ForegroundColor Gray
        Write-Host "  Size: $($captureDetail.file_size) bytes" -ForegroundColor Gray
    }
}

Test-Endpoint -Name "Get non-existent capture (should 404)" `
    -Method "GET" `
    -Url "$BaseUrl/api/v1/captures/00000000-0000-0000-0000-000000000000" `
    -ExpectedStatus 404

# 5. START ANALYSIS - STRONG PCAP
Write-TestHeader "5. START ANALYSIS - STRONG PCAP"

if ($script:CaptureId -ne "") {
    $analysisResult = Test-Endpoint -Name "Start analysis for strong PCAP" `
        -Method "POST" `
        -Url "$BaseUrl/api/v1/analysis/start/$($script:CaptureId)" `
        -ExpectedStatus 202 `
        -ReturnBody

    if ($analysisResult) {
        Write-Host "  Job ID: $($analysisResult.id)" -ForegroundColor Magenta
        Write-Host "  Status: $($analysisResult.status)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "  Waiting for analysis to complete..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $analysisComplete = $false

    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2

        try {
            $statusResp = Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/v1/analysis/status/$($script:CaptureId)" -UseBasicParsing -ErrorAction Stop
            $statusData = $statusResp.Content | ConvertFrom-Json

            Write-Host "  [$waited`s] Status: $($statusData.status), Progress: $($statusData.progress)%" -ForegroundColor Gray

            if ($statusData.status -eq "completed") {
                $analysisComplete = $true
                break
            }
            if ($statusData.status -eq "failed") {
                Write-Host "  Analysis FAILED: $($statusData.error_message)" -ForegroundColor Red
                break
            }
        }
        catch {
            Write-Host "  [$waited`s] Polling..." -ForegroundColor DarkGray
        }
    }

    if ($analysisComplete) {
        Write-Host "  Analysis completed!" -ForegroundColor Green
    }
    else {
        Write-Host "  Analysis did not complete within ${maxWait}s" -ForegroundColor Red
    }
}

# 6. RETRIEVE ANALYSIS RESULTS
Write-TestHeader "6. RETRIEVE ANALYSIS RESULTS"

if ($script:CaptureId -ne "") {
    Test-Endpoint -Name "Get analysis status" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/analysis/status/$($script:CaptureId)" `
        -ExpectedStatus 200

    $fullResult = Test-Endpoint -Name "Get full analysis results" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/analysis/results/$($script:CaptureId)" `
        -ExpectedStatus 200 `
        -ReturnBody

    if ($fullResult) {
        Write-Host "  Protocol: $($fullResult.classification.protocol_detected)" -ForegroundColor Cyan
        Write-Host "  IKE Version: $($fullResult.classification.ike_version)" -ForegroundColor Cyan
        Write-Host "  Encryption: $($fullResult.classification.encryption_algo)" -ForegroundColor Cyan
        Write-Host "  Risk Score: $($fullResult.security_assessment.risk_score)" -ForegroundColor Cyan
        Write-Host "  Severity: $($fullResult.security_assessment.severity)" -ForegroundColor Cyan
    }
}

# 7. CLASSIFICATION & SECURITY ENDPOINTS
Write-TestHeader "7. CLASSIFICATION & SECURITY ENDPOINTS"

if ($script:CaptureId -ne "") {
    $classResult = Test-Endpoint -Name "Get classification" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/classification/$($script:CaptureId)" `
        -ExpectedStatus 200 `
        -ReturnBody

    if ($classResult) {
        Write-Host "  Protocol: $($classResult.protocol_detected)" -ForegroundColor Gray
        Write-Host "  Confidence: $($classResult.confidence_score)" -ForegroundColor Gray
    }

    $secResult = Test-Endpoint -Name "Get security assessment" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/security/$($script:CaptureId)" `
        -ExpectedStatus 200 `
        -ReturnBody

    if ($secResult) {
        Write-Host "  Risk Score: $($secResult.risk_score)" -ForegroundColor Gray
        Write-Host "  Severity: $($secResult.severity)" -ForegroundColor Gray
        Write-Host "  Crypto Strength: $($secResult.crypto_strength)" -ForegroundColor Gray
    }
}

# 8. REPORT GENERATION
Write-TestHeader "8. REPORT GENERATION"

if ($script:CaptureId -ne "") {
    $reportGenResult = Test-Endpoint -Name "Generate HTML report" `
        -Method "POST" `
        -Url "$BaseUrl/api/v1/reports/generate/$($script:CaptureId)" `
        -ExpectedStatus 201 `
        -ReturnBody

    if ($reportGenResult) {
        $script:ReportId = $reportGenResult.report_id
        Write-Host "  Report ID: $($script:ReportId)" -ForegroundColor Magenta
    }

    if ($script:ReportId -ne "") {
        Test-Endpoint -Name "Get report metadata" `
            -Method "GET" `
            -Url "$BaseUrl/api/v1/reports/$($script:ReportId)" `
            -ExpectedStatus 200

        Test-Endpoint -Name "Download report" `
            -Method "GET" `
            -Url "$BaseUrl/api/v1/reports/$($script:ReportId)/download" `
            -ExpectedStatus 200
    }
}

# 9. ANALYZE WEAK PCAP (Contrast Test)
Write-TestHeader "9. ANALYZE WEAK PCAP (Contrast Test)"

if ($WeakCaptureId -ne "") {
    Test-Endpoint -Name "Start analysis for weak PCAP" `
        -Method "POST" `
        -Url "$BaseUrl/api/v1/analysis/start/$WeakCaptureId" `
        -ExpectedStatus 202

    Write-Host ""
    Write-Host "  Waiting for weak PCAP analysis..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0

    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $statusResp = Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/v1/analysis/status/$WeakCaptureId" -UseBasicParsing -ErrorAction Stop
            $statusData = $statusResp.Content | ConvertFrom-Json
            if ($statusData.status -eq "completed") { break }
            if ($statusData.status -eq "failed") { break }
        }
        catch {}
    }

    $weakResult = Test-Endpoint -Name "Get weak PCAP security assessment" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/security/$WeakCaptureId" `
        -ExpectedStatus 200 `
        -ReturnBody

    if ($weakResult) {
        Write-Host "  Weak Risk Score: $($weakResult.risk_score)" -ForegroundColor Red
        Write-Host "  Weak Severity: $($weakResult.severity)" -ForegroundColor Red

        # Contrast test
        $script:TotalTests++
        if ($weakResult.risk_score -gt 50) {
            $script:PassedTests++
            Write-Host "  PASS: Weak PCAP has HIGH/CRITICAL risk (score > 50)" -ForegroundColor Green
        }
        else {
            $script:FailedTests++
            Write-Host "  FAIL: Weak PCAP should have risk > 50, got $($weakResult.risk_score)" -ForegroundColor Red
        }
    }
}

# 10. DASHBOARD
Write-TestHeader "10. DASHBOARD SUMMARY"

$dashResult = Test-Endpoint -Name "Get dashboard summary" `
    -Method "GET" `
    -Url "$BaseUrl/api/v1/dashboard/summary" `
    -ExpectedStatus 200 `
    -ReturnBody

if ($dashResult) {
    Write-Host "  Total Captures: $($dashResult.total_captures)" -ForegroundColor Gray
    Write-Host "  Total Analyses: $($dashResult.total_analyses)" -ForegroundColor Gray
    Write-Host "  Avg Risk Score: $($dashResult.average_risk_score)" -ForegroundColor Gray
}

# 11. CLEANUP
Write-TestHeader "11. CLEANUP"

# Summary
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total:  $TotalTests" -ForegroundColor White
Write-Host "  Passed: $PassedTests" -ForegroundColor Green
Write-Host "  Failed: $FailedTests" -ForegroundColor Red
Write-Host ""

if ($FailedTests -eq 0) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
}
else {
    Write-Host "  $FailedTests TEST(S) FAILED" -ForegroundColor Red
}

Write-Host ""
exit $FailedTests
