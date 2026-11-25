param([string]$SourceRoot = (Join-Path $PSScriptRoot '../..'))
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Force assets | Out-Null
$sources = @('4165-8a75a23cc6','4526-96519a18e2','4630-d6139c4585','4706-688d2c1e4b','4792-df69e7fcf8','4882-05f946f668','4128-7bb78d0c45','4590-f0a6a17a2d','4203-c590d670e9')
function Source([int]$slot) { Join-Path $SourceRoot ('assets/source/179517946' + $sources[$slot-1] + $(if($slot -eq 7){'.jpg'}else{'.mp4'})) }
function Encode([string[]]$argsList) {
  & ffmpeg -nostdin -hide_banner -loglevel error -y @argsList
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg: $($argsList[-1])" }
}
function Clip($slot,$output,$start,$length,$frames,$filter) {
  Encode @('-ss',"$start",'-t',"$length",'-i',(Source $slot),'-an','-vf',"$filter,tpad=stop_mode=clone:stop_duration=3",'-frames:v',"$frames",'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',"assets/$output.mp4")
}
Clip 1 desk-a 0.300 2.930 138 'setpts=PTS*4.6/2.93,fps=30'
Clip 1 desk-b 3.230 1.600 57 'setpts=PTS*1.9/1.6,fps=30'
Clip 1 hand 4.830 3.000 90 'fps=30'
Clip 2 editor 1.750 1.033 34 'fps=30'
Clip 5 probes 1.400 1.033 35 'fps=30,scale=1280:720'
Clip 9 signature 0.200 2.330 70 'fps=30'
Encode @('-ss','5.350','-i',(Source 1),'-frames:v','1','assets/desk-hold.jpg')
Copy-Item -LiteralPath (Source 7) -Destination assets/rack.jpg -Force
$windows = @(@(1,0.300,1.300,92),@(2,1.750,2.600,86),@(3,3.750,2.800,80),@(4,0.650,2.800,72),@(5,1.400,2.700,67),@(6,2.150,2.500,62),@(8,3.050,2.550,51),@(9,0.200,3.050,47))
foreach ($entry in $windows) {
  $filter = if ($entry[0] -eq 3) {'fps=30,scale=432:768'} else {'fps=30,scale=640:360'}
  Clip $entry[0] ('window-'+$entry[0]) $entry[1] $entry[2] $entry[3] $filter
}
$wav = Join-Path $SourceRoot 'assets/speech/speech-job_2bef1770-e8ad-46f3-8050-1c6f15772fe9.wav'
Encode @('-i',$wav,'-af','atrim=start_sample=1705200:end_sample=2010240,asetpts=PTS-STARTPTS','-c:a','pcm_s16le','assets/narration.wav')
# 字体已随交付目录提供于 assets/NotoSansSC-VF.ttf。
