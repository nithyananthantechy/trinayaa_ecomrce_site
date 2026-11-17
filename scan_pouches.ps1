[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {
    Write-Host "Failed to create OCR engine"
    exit 1
}

for ($i = 1; $i -le 20; $i++) {
    $num = "{0:D3}" -f $i
    $p = (Resolve-Path "client/public/images/products/packaged/pouch_$num.png").Path
    if (-not (Test-Path $p)) { continue }
    
    $fileTask = [Windows.Storage.StorageFile]::GetFileFromPathAsync($p)
    $file = $fileTask.AsTask().GetAwaiter().GetResult()
    
    $streamTask = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = $streamTask.AsTask().GetAwaiter().GetResult()
    
    $decoderTask = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = $decoderTask.AsTask().GetAwaiter().GetResult()
    
    $bmpTask = $decoder.GetSoftwareBitmapAsync()
    $bmp = $bmpTask.AsTask().GetAwaiter().GetResult()
    
    $ocrTask = $engine.RecognizeAsync($bmp)
    $result = $ocrTask.AsTask().GetAwaiter().GetResult()
    
    $cleanText = ($result.Text -replace "`r`n", " " -replace "`n", " ").Trim()
    Write-Host "pouch_$num : $cleanText"
}

