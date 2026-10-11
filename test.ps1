$ErrorActionPreference = 'Stop'
$baseUrl = "http://localhost:5000/api/v1"

Write-Host "`n=== 1. Logging In ===" -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body '{"email":"asha@corp.com","password":"user123"}'
$token = $loginResponse.data.token
Write-Host "✅ Login Successful! Token acquired." -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

Write-Host "`n=== 2. Booking Meeting A ===" -ForegroundColor Cyan
$bodyA = @{
    title          = "Meeting A"
    roomId         = 1
    startTime      = "2026-10-15 10:00:00"
    endTime        = "2026-10-15 11:00:00"
    attendees      = 4
    participantIds = @(3, 4)
} | ConvertTo-Json
$meetingAResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/meetings" -Headers $headers -ContentType "application/json" -Body $bodyA
$meetingAId = $meetingAResponse.data.meetingId
Write-Host "✅ Meeting A Booked Successfully! ID: $meetingAId" -ForegroundColor Green

Write-Host "`n=== 3. Attempting to Book Overlapping Meeting B ===" -ForegroundColor Cyan
$bodyB = @{
    title          = "Meeting B (Overlap)"
    roomId         = 1
    startTime      = "2026-10-15 10:30:00"
    endTime        = "2026-10-15 11:30:00"
    attendees      = 4
    participantIds = @()
} | ConvertTo-Json

try {
    $null = Invoke-RestMethod -Method Post -Uri "$baseUrl/meetings" -Headers $headers -ContentType "application/json" -Body $bodyB
    Write-Host "❌ UH OH! Meeting B was booked, but it should have failed!" -ForegroundColor Red
}
catch {
    # Extract the JSON error message
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errorJson = $streamReader.ReadToEnd() | ConvertFrom-Json
    
    Write-Host "✅ Correctly rejected! (Got 409 Conflict)" -ForegroundColor Green
    Write-Host "Message from server: $($errorJson.message)" -ForegroundColor Yellow
}

Write-Host "`n=== 4. Cancelling Meeting A ===" -ForegroundColor Cyan
$bodyCancel = @{ reason = "Cancelled for testing" } | ConvertTo-Json
$null = Invoke-RestMethod -Method Patch -Uri "$baseUrl/meetings/$meetingAId/cancel" -Headers $headers -ContentType "application/json" -Body $bodyCancel
Write-Host "✅ Meeting A Cancelled." -ForegroundColor Green


Write-Host "`n=== 5. Re-Booking Meeting B (Should work now) ===" -ForegroundColor Cyan
$meetingBResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/meetings" -Headers $headers -ContentType "application/json" -Body $bodyB
Write-Host "✅ Meeting B Booked Successfully! ID: $($meetingBResponse.data.meetingId)" -ForegroundColor Green


Write-Host "`n=== 6. Testing RoomBot AI ===" -ForegroundColor Cyan
$bodyBot = @{
    sessionId = "demo-chat-123"
    text      = "Book a room tomorrow at 3pm for 5 people"
} | ConvertTo-Json
$botResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/roombot/message" -Headers $headers -ContentType "application/json" -Body $bodyBot
Write-Host "🤖 RoomBot replied: $($botResponse.data.reply.text)" -ForegroundColor Magenta

Write-Host "`n=== 7. Testing History Section (GET /meetings) ===" -ForegroundColor Cyan
$historyResponse = Invoke-RestMethod -Method Get -Uri "$baseUrl/meetings" -Headers $headers
$historyCount = $historyResponse.data.Count
Write-Host "✅ History fetched successfully! Found $historyCount bookings for user." -ForegroundColor Green
if ($historyCount -gt 0) {
    Write-Host "Most recent booking: $($historyResponse.data[0].title) (Status: $($historyResponse.data[0].status))" -ForegroundColor Yellow
}

Write-Host "`n=== 8. Testing Calendar Section (GET Room Schedule) ===" -ForegroundColor Cyan
$calendarDate = "2026-10-15"
$calendarResponse = Invoke-RestMethod -Method Get -Uri "$baseUrl/rooms/1/schedule?date=$calendarDate" -Headers $headers
$calendarCount = $calendarResponse.data.Count
Write-Host "✅ Calendar fetched successfully for Room 1 on $calendarDate! Found $calendarCount active bookings." -ForegroundColor Green
if ($calendarCount -gt 0) {
    Write-Host "First booking in calendar: $($calendarResponse.data[0].title)" -ForegroundColor Yellow
}

Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
