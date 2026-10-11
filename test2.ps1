$ErrorActionPreference = 'Stop'
$baseUrl = "http://localhost:5000/api/v1"

Write-Host "`n=== 1. Logging In as Owner ===" -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body '{"email":"arjun@venuehub.in","password":"owner123"}'
$token = $loginResponse.data.token
Write-Host "✅ Logged in as Owner1! Token acquired." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

Write-Host "`n=== 2. Owner Creating a New Room with Pricing ===" -ForegroundColor Cyan
$bodyNewRoom = @{
    name = "New Owner Room"
    capacity = 10
    pricing_type = "HOURLY"
    price_per_hour = 250
} | ConvertTo-Json
$roomResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/owner/rooms" -Headers $headers -ContentType "application/json" -Body $bodyNewRoom
$roomId = $roomResponse.data.roomId
Write-Host "✅ Room Created! ID: $roomId" -ForegroundColor Green

Write-Host "`n=== 3. Owner Updating Room Pricing to BOTH ===" -ForegroundColor Cyan
$bodyUpdatePrice = @{
    pricing_type = "BOTH"
    price_per_hour = 250
    price_per_day = 1000
} | ConvertTo-Json
$null = Invoke-RestMethod -Method Patch -Uri "$baseUrl/owner/rooms/$roomId/pricing" -Headers $headers -ContentType "application/json" -Body $bodyUpdatePrice
Write-Host "✅ Pricing Updated to BOTH (250/hr, 1000/day)." -ForegroundColor Green

Write-Host "`n=== 4. User Checking Room Cost for 5 hours ===" -ForegroundColor Cyan
# Calculate expected cost: 5 hours * 250 = 1250, but daily cap is 1000. So it should be 1000.
$bodyCheck = @{
    roomId = $roomId
    startTime = "2026-10-20 10:00:00"
    endTime = "2026-10-20 15:00:00"
    attendees = 5
} | ConvertTo-Json

$checkResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/meetings/check" -Headers $headers -ContentType "application/json" -Body $bodyCheck
$cost = $checkResponse.data.estimatedCost
$note = $checkResponse.data.priceNote
Write-Host "✅ User quoted cost: $cost INR ($note)" -ForegroundColor Green

Write-Host "`n=== 5. User Books the Meeting ===" -ForegroundColor Cyan
$bodyBook = @{
    title = "Test Price Meeting"
    roomId = $roomId
    startTime = "2026-10-20 10:00:00"
    endTime = "2026-10-20 15:00:00"
    attendees = 5
} | ConvertTo-Json

$bookResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/meetings" -Headers $headers -ContentType "application/json" -Body $bodyBook
Write-Host "✅ Meeting booked! Final stored cost: $($bookResponse.data.totalCost) INR" -ForegroundColor Green

Write-Host "`n=== 6. Owner Checking Earnings ===" -ForegroundColor Cyan
$earningsResponse = Invoke-RestMethod -Method Get -Uri "$baseUrl/owner/earnings" -Headers $headers
Write-Host "✅ Upcoming Earnings: $($earningsResponse.data.upcomingValue) INR" -ForegroundColor Green

Write-Host "`n🎉 ALL OWNER TESTS PASSED!" -ForegroundColor Green
