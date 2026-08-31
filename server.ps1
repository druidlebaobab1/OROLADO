$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'http://localhost:8090/'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()
Write-Host "OROLADO.COM actif sur $url"

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    try {
        $path = [Uri]::UnescapeDataString($context.Request.Url.LocalPath)
        if ($path -eq '/' -or [string]::IsNullOrWhiteSpace($path)) { $path = '/index.html' }
        $safe = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
        $filePath = [IO.Path]::GetFullPath((Join-Path $root $safe))
        if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Chemin refuse'
        }
        if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
            $response.StatusCode = 404
            $msg = [Text.Encoding]::UTF8.GetBytes('Introuvable')
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        } else {
            $ext = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
            $content = [IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
            $response.StatusCode = 200
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        }
    } catch {
        $msg = [Text.Encoding]::UTF8.GetBytes('Erreur')
        $response.StatusCode = 500
        $response.ContentLength64 = $msg.Length
        $response.OutputStream.Write($msg, 0, $msg.Length)
    } finally {
        $response.OutputStream.Close()
    }
}
