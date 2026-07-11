Stop-Process -Name postgres -Force -ErrorAction SilentlyContinue
Stop-Process -Name minio -Force -ErrorAction SilentlyContinue
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Remove-Item -Path d:\local_services\pgdata\postmaster.pid -Force -ErrorAction SilentlyContinue

Start-Process "d:\local_services\pgsql\bin\postgres.exe" -ArgumentList "-D d:\local_services\pgdata" -WindowStyle Hidden
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="minioadminpassword"
Start-Process "d:\local_services\minio.exe" -ArgumentList "server d:\local_services\data" -WindowStyle Hidden

Write-Host "Waiting for Postgres..."
while ($true) {
    & d:\local_services\pgsql\bin\pg_isready.exe -h 127.0.0.1 -p 5432 -U postgres
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
}

Write-Host "Initializing MinIO Bucket..."
$env:S3_ENDPOINT="http://127.0.0.1:9000"
$env:S3_BUCKET="agentshare-assets"
$env:S3_REGION="us-east-1"
$env:S3_ACCESS_KEY_ID="minioadmin"
$env:S3_SECRET_ACCESS_KEY="minioadminpassword"
Set-Location d:\agentshare
npx tsx d:\agentshare\scripts\init-bucket.ts

node d:\agentshare\seed-user.js

Write-Host "Starting Next.js..."
Start-Process "cmd.exe" -ArgumentList "/c `"cd d:\agentshare && npm run dev > next_dev.log 2>&1`"" -WindowStyle Hidden

Write-Host "Waiting for Next.js..."
while ($true) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/csrf" -Method Get -ErrorAction Stop
        if ($res.StatusCode -eq 200) { break }
    } catch {
        # ignore
    }
    Start-Sleep -Seconds 2
}

Write-Host "All services started."
