export function generateWindowsWpfScript(defaultHost = '192.168.1.42', defaultPort = 8060): string {
  const safeHost = defaultHost.replace(/[^a-zA-Z0-9.-]/g, '') || '192.168.1.42';
  const safePort = Number.isInteger(defaultPort) && defaultPort >= 8060 && defaultPort <= 8090 ? defaultPort : 8060;

  return `<#
.SYNOPSIS
    RokuDeck Native Windows Desktop GUI (WPF + PowerShell)
    Controls Roku TVs on your local Wi-Fi/LAN via Roku External Control Protocol (ECP).
.NOTES
    Zero external dependencies required on Windows 10 / Windows 11.
#>

$ErrorActionPreference = "Stop"

try {
    Add-Type -AssemblyName PresentationFramework
    Add-Type -AssemblyName PresentationCore
    Add-Type -AssemblyName WindowsBase

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="RokuDeck - Windows Roku TV Remote"
        Width="440" Height="790"
        MinWidth="400" MinHeight="700"
        Background="#0B0F17" Foreground="#F1F5F9"
        WindowStartupLocation="CenterScreen"
        FontFamily="Segoe UI">
    <Window.Resources>
        <Style TargetType="Button" x:Key="RemoteBtn">
            <Setter Property="Background" Value="#1A2232"/>
            <Setter Property="Foreground" Value="#F1F5F9"/>
            <Setter Property="BorderBrush" Value="#2A3549"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="FontSize" Value="13"/>
            <Setter Property="FontWeight" Value="SemiBold"/>
            <Setter Property="Height" Value="42"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Background="{TemplateBinding Background}"
                                BorderBrush="{TemplateBinding BorderBrush}"
                                BorderThickness="{TemplateBinding BorderThickness}"
                                CornerRadius="8">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter Property="Background" Value="#243046"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter Property="Background" Value="#7C3AED"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style TargetType="Button" x:Key="AccentBtn" BasedOn="{StaticResource RemoteBtn}">
            <Setter Property="Background" Value="#7C3AED"/>
            <Setter Property="BorderBrush" Value="#8B5CF6"/>
        </Style>
    </Window.Resources>

    <Grid Margin="18">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <!-- Header -->
        <StackPanel Grid.Row="0" Margin="0,0,0,12">
            <TextBlock Text="RokuDeck" FontSize="20" FontWeight="Bold" Foreground="#F8FAFC"/>
            <TextBlock Text="Windows ECP Remote Controller" FontSize="12" Foreground="#94A3B8"/>
        </StackPanel>

        <!-- TV Selector & Scan -->
        <Border Grid.Row="1" Background="#121824" BorderBrush="#222C3E" BorderThickness="1" CornerRadius="10" Padding="12" Margin="0,0,0,14">
            <StackPanel>
                <Grid Margin="0,0,0,8">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>
                    <TextBox x:Name="IpTextBox" Grid.Column="0" Text="${safeHost}:${safePort}"
                             Background="#0B0F17" Foreground="#F8FAFC" BorderBrush="#2A3549"
                             Padding="8,6" FontFamily="Consolas" FontSize="13" VerticalContentAlignment="Center"/>
                    <Button x:Name="ConnectBtn" Grid.Column="1" Content="Test" Width="62" Height="34" Margin="8,0,0,0" Style="{StaticResource RemoteBtn}"/>
                    <Button x:Name="ScanBtn" Grid.Column="2" Content="Scan LAN" Width="82" Height="34" Margin="8,0,0,0" Style="{StaticResource AccentBtn}"/>
                </Grid>
                <ComboBox x:Name="DiscoveredCombo" Visibility="Collapsed" Margin="0,4,0,6" Padding="6,4"/>
                <TextBlock x:Name="StatusText" Text="Ready. Click Scan LAN or enter your Roku TV IP." FontSize="12" Foreground="#94A3B8" TextTrimming="CharacterEllipsis"/>
            </StackPanel>
        </Border>

        <!-- Top Back / Home / Power -->
        <Grid Grid.Row="2" Margin="0,0,0,12">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            <Button x:Name="BtnBack" Grid.Column="0" Content="Back" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnHome" Grid.Column="2" Content="Home" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnPower" Grid.Column="4" Content="Power" Background="#7F1D1D" BorderBrush="#991B1B" Style="{StaticResource RemoteBtn}"/>
        </Grid>

        <!-- D-Pad -->
        <Border Grid.Row="3" Background="#121824" BorderBrush="#222C3E" BorderThickness="1" CornerRadius="12" Padding="14" Margin="0,0,0,12">
            <Grid Width="228" Height="174">
                <Grid.RowDefinitions>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="8"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="8"/>
                    <RowDefinition Height="*"/>
                </Grid.RowDefinitions>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="8"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="8"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>

                <Button x:Name="BtnUp" Grid.Row="0" Grid.Column="2" Content="Up" Style="{StaticResource RemoteBtn}"/>
                <Button x:Name="BtnLeft" Grid.Row="2" Grid.Column="0" Content="Left" Style="{StaticResource RemoteBtn}"/>
                <Button x:Name="BtnOk" Grid.Row="2" Grid.Column="2" Content="OK" Style="{StaticResource AccentBtn}"/>
                <Button x:Name="BtnRight" Grid.Row="2" Grid.Column="4" Content="Right" Style="{StaticResource RemoteBtn}"/>
                <Button x:Name="BtnDown" Grid.Row="4" Grid.Column="2" Content="Down" Style="{StaticResource RemoteBtn}"/>
            </Grid>
        </Border>

        <!-- Transport & Volume -->
        <Grid Grid.Row="4" Margin="0,0,0,12">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="8"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="8"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <Button x:Name="BtnReplay" Grid.Row="0" Grid.Column="0" Content="Replay" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnStar" Grid.Row="0" Grid.Column="2" Content="* Options" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnSearchKey" Grid.Row="0" Grid.Column="4" Content="Search" Style="{StaticResource RemoteBtn}"/>

            <Button x:Name="BtnRev" Grid.Row="2" Grid.Column="0" Content="&lt;&lt; Rew" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnPlay" Grid.Row="2" Grid.Column="2" Content="Play / Pause" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnFwd" Grid.Row="2" Grid.Column="4" Content="Fwd &gt;&gt;" Style="{StaticResource RemoteBtn}"/>

            <Button x:Name="BtnVolDown" Grid.Row="4" Grid.Column="0" Content="Vol -" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnMute" Grid.Row="4" Grid.Column="2" Content="Mute" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnVolUp" Grid.Row="4" Grid.Column="4" Content="Vol +" Style="{StaticResource RemoteBtn}"/>
        </Grid>

        <!-- Text Input -->
        <Grid Grid.Row="5" Margin="0,0,0,12">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>
            <TextBox x:Name="SendTextInput" Grid.Column="0" Background="#121824" Foreground="#F8FAFC"
                     BorderBrush="#2A3549" Padding="10,8" FontSize="13" VerticalContentAlignment="Center"/>
            <Button x:Name="SendTextBtn" Grid.Column="2" Content="Send Text" Width="96" Style="{StaticResource AccentBtn}"/>
        </Grid>

        <!-- Quick Inputs -->
        <Grid Grid.Row="6" Margin="0,0,0,10">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            <Button x:Name="BtnHdmi1" Grid.Column="0" Content="HDMI 1" Height="36" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnHdmi2" Grid.Column="2" Content="HDMI 2" Height="36" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnHdmi3" Grid.Column="4" Content="HDMI 3" Height="36" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnTuner" Grid.Column="6" Content="Live TV" Height="36" Style="{StaticResource RemoteBtn}"/>
        </Grid>

        <!-- Quick Channels -->
        <Grid Grid.Row="7" VerticalAlignment="Top">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="8"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            <Button x:Name="BtnNetflix" Grid.Column="0" Content="Netflix" Height="36" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnYouTube" Grid.Column="2" Content="YouTube" Height="36" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnPrime" Grid.Column="4" Content="Prime" Height="36" Style="{StaticResource RemoteBtn}"/>
            <Button x:Name="BtnPlex" Grid.Column="6" Content="Plex" Height="36" Style="{StaticResource RemoteBtn}"/>
        </Grid>
    </Grid>
</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [Windows.Markup.XamlReader]::Load($reader)

$IpTextBox = $window.FindName("IpTextBox")
$StatusText = $window.FindName("StatusText")
$DiscoveredCombo = $window.FindName("DiscoveredCombo")
$SendTextInput = $window.FindName("SendTextInput")

function Get-RokuBaseUrl {
    $raw = $IpTextBox.Text.Trim()
    if ($raw -notmatch ":") { $raw = ($raw + ":8060") }
    return ("http://" + $raw)
}

function Send-RokuPost([string]$path) {
    $base = Get-RokuBaseUrl
    $url = ($base + $path)
    try {
        Invoke-RestMethod -Uri $url -Method Post -TimeoutSec 2 | Out-Null
        $StatusText.Text = ("Sent " + $path + " -> OK")
    } catch {
        $StatusText.Text = ("Error reaching " + $base + ": " + $_.Exception.Message)
    }
}

$window.FindName("ConnectBtn").Add_Click({
    $base = Get-RokuBaseUrl
    try {
        [xml]$info = Invoke-RestMethod -Uri ($base + "/query/device-info") -Method Get -TimeoutSec 2
        $name = $info."device-info"."user-device-name"
        if (-not $name) { $name = $info."device-info"."model-name" }
        $StatusText.Text = ("Connected: " + $name + " (" + $info."device-info"."model-name" + ")")
    } catch {
        $StatusText.Text = ("Could not connect to " + $base)
    }
})

$window.FindName("ScanBtn").Add_Click({
    $StatusText.Text = "Scanning LAN via SSDP multicast..."
    $udp = New-Object System.Net.Sockets.UdpClient
    $udp.Client.ReceiveTimeout = 1800
    $crlf = [string]::Concat([char]13, [char]10)
    $payload = "M-SEARCH * HTTP/1.1" + $crlf + "HOST: 239.255.255.250:1900" + $crlf + 'MAN: "ssdp:discover"' + $crlf + "ST: roku:ecp" + $crlf + "MX: 2" + $crlf + $crlf
    $msg = [Text.Encoding]::ASCII.GetBytes($payload)
    $ep = New-Object System.Net.IPEndPoint([Net.IPAddress]::Parse("239.255.255.250"), 1900)
    $udp.Send($msg, $msg.Length, $ep) | Out-Null
    $found = @()
    $remoteEp = New-Object System.Net.IPEndPoint([Net.IPAddress]::Any, 0)
    try {
        while ($true) {
            $bytes = $udp.Receive([ref]$remoteEp)
            $resp = [Text.Encoding]::ASCII.GetString($bytes)
            if ($resp -match "LOCATION:\\s*http://([^/\\r\\n]+)") {
                $hostPort = $Matches[1]
                if ($found -notcontains $hostPort) { $found += $hostPort }
            }
        }
    } catch {}
    $udp.Close()
    if ($found.Count -gt 0) {
        $DiscoveredCombo.ItemsSource = $found
        $DiscoveredCombo.SelectedIndex = 0
        $DiscoveredCombo.Visibility = "Visible"
        $IpTextBox.Text = $found[0]
        $StatusText.Text = ("Found " + $found.Count + " Roku device(s).")
    } else {
        $StatusText.Text = "No Roku TVs answered SSDP scan. Enter TV IP manually."
    }
})

$DiscoveredCombo.Add_SelectionChanged({
    if ($DiscoveredCombo.SelectedItem) {
        $IpTextBox.Text = $DiscoveredCombo.SelectedItem.ToString()
    }
})

$keyMap = @{
    "BtnBack" = "Back"; "BtnHome" = "Home"; "BtnPower" = "Power";
    "BtnUp" = "Up"; "BtnDown" = "Down"; "BtnLeft" = "Left"; "BtnRight" = "Right"; "BtnOk" = "Select";
    "BtnReplay" = "InstantReplay"; "BtnStar" = "Info"; "BtnSearchKey" = "Search";
    "BtnRev" = "Rev"; "BtnPlay" = "Play"; "BtnFwd" = "Fwd";
    "BtnVolDown" = "VolumeDown"; "BtnMute" = "VolumeMute"; "BtnVolUp" = "VolumeUp";
    "BtnHdmi1" = "InputHDMI1"; "BtnHdmi2" = "InputHDMI2"; "BtnHdmi3" = "InputHDMI3"; "BtnTuner" = "InputTuner"
}

foreach ($entry in $keyMap.GetEnumerator()) {
    $btnName = $entry.Key
    $ecpKey = $entry.Value
    $window.FindName($btnName).Add_Click({
        Send-RokuPost ("/keypress/" + $ecpKey)
    }.GetNewClosure())
}

$window.FindName("SendTextBtn").Add_Click({
    $txt = $SendTextInput.Text
    if ($txt) {
        foreach ($ch in $txt.ToCharArray()) {
            $encoded = [Uri]::EscapeDataString([string]$ch)
            Send-RokuPost ("/keypress/Lit_" + $encoded)
        }
        $SendTextInput.Clear()
    }
})

$window.FindName("BtnNetflix").Add_Click({ Send-RokuPost "/launch/12" })
$window.FindName("BtnYouTube").Add_Click({ Send-RokuPost "/launch/837" })
$window.FindName("BtnPrime").Add_Click({ Send-RokuPost "/launch/13" })
$window.FindName("BtnPlex").Add_Click({ Send-RokuPost "/launch/13535" })

$window.Add_KeyDown({
    param($sender, $e)
    if ($IpTextBox.IsFocused -or $SendTextInput.IsFocused) { return }
    switch ($e.Key) {
        "Up"     { Send-RokuPost "/keypress/Up"; $e.Handled = $true }
        "Down"   { Send-RokuPost "/keypress/Down"; $e.Handled = $true }
        "Left"   { Send-RokuPost "/keypress/Left"; $e.Handled = $true }
        "Right"  { Send-RokuPost "/keypress/Right"; $e.Handled = $true }
        "Return" { Send-RokuPost "/keypress/Select"; $e.Handled = $true }
        "Escape" { Send-RokuPost "/keypress/Back"; $e.Handled = $true }
        "Space"  { Send-RokuPost "/keypress/Play"; $e.Handled = $true }
    }
})

$window.ShowDialog() | Out-Null
} catch {
    [System.Windows.MessageBox]::Show($_.Exception.Message, "RokuDeck Error") | Out-Null
}
`;
}

export function generateSingleFileWindowsBat(defaultHost = '192.168.1.42', defaultPort = 8060): string {
  const psScript = generateWindowsWpfScript(defaultHost, defaultPort);
  const lines = [
    '@echo off',
    'setlocal',
    'set "ROKUDECK_SCRIPT=%~f0"',
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$code = (Get-Content -LiteralPath $env:ROKUDECK_SCRIPT -Raw) -replace \'^[\\s\\S]*?###_ROKUDECK_PS_START_###\', \'\'; Invoke-Expression $code"',
    'exit /b',
    '###_ROKUDECK_PS_START_###',
    psScript,
  ];
  return lines.join('\r\n');
}

export function generateDesktopAppLauncherBat(): string {
  return [
    '@echo off',
    'setlocal',
    'cd /d "%~dp0"',
    'title RokuDeck Local Desktop Launcher',
    '',
    'if not exist "package.json" (',
    '    echo.',
    '    echo [RokuDeck] Could not find package.json in "%CD%".',
    '    echo.',
    '    echo This launcher starts the full Node/React RokuDeck project from its source folder.',
    '    echo If you want the zero-install standalone Windows GUI that runs straight from',
    '    echo your Downloads folder, download "RokuDeck-Windows.bat" from the Windows App tab.',
    '    echo.',
    '    pause',
    '    exit /b 1',
    ')',
    '',
    'if not exist "node_modules" (',
    '    echo Installing dependencies...',
    '    call npm install',
    ')',
    '',
    'if not exist "dist" (',
    '    echo Building RokuDeck...',
    '    call npm run build',
    ')',
    '',
    'echo Starting RokuDeck Local Server on http://localhost:3000 ...',
    'start "" /B cmd /c "npm start"',
    'timeout /t 2 /nobreak >nul',
    'start "" msedge --app=http://localhost:3000 --window-size=1320,860',
    '',
  ].join('\r\n');
}
