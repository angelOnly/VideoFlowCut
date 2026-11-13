$ErrorActionPreference = 'Stop'

# 在独立线程接收 Windows 窗口事件，避免子进程很快退出时漏掉闪现的终端。
Add-Type -TypeDefinition @'
using System;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class BackgroundWindowObserver {
    private delegate void WindowEvent(IntPtr hook, uint eventType, IntPtr window, int objectId, int childId, uint thread, uint time);
    private delegate IntPtr WindowProcedure(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
    private static readonly WindowEvent callback = OnWindowEvent;
    private static readonly WindowProcedure windowProcedure = DefWindowProc;
    private static readonly ManualResetEvent ready = new ManualResetEvent(false);
    private static readonly ConcurrentQueue<string> terminals = new ConcurrentQueue<string>();
    private static uint threadId;
    private static IntPtr showHook;
    private static IntPtr foregroundHook;
    private static IntPtr controlWindow;
    private static int controlEvents;
    private static int allEvents;
    private const string ControlTitle = "VideoFlowCutBackgroundWindowTest";

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG { public IntPtr hwnd; public uint message; public UIntPtr wParam; public IntPtr lParam; public uint time; public int x; public int y; public uint lPrivate; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WNDCLASS { public uint style; public WindowProcedure procedure; public int classExtra; public int windowExtra; public IntPtr instance; public IntPtr icon; public IntPtr cursor; public IntPtr background; public string menu; public string name; }
    [DllImport("user32.dll")] private static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr module, WindowEvent callback, uint process, uint thread, uint flags);
    [DllImport("user32.dll")] private static extern bool UnhookWinEvent(IntPtr hook);
    [DllImport("user32.dll")] private static extern int GetMessage(out MSG message, IntPtr window, uint min, uint max);
    [DllImport("user32.dll")] private static extern bool PostThreadMessage(uint thread, uint message, UIntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr window, StringBuilder name, int maximum);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr CreateWindowEx(uint exStyle, string className, string title, uint style, int x, int y, int width, int height, IntPtr parent, IntPtr menu, IntPtr instance, IntPtr parameter);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr window, int command);
    [DllImport("user32.dll")] private static extern bool DestroyWindow(IntPtr window);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern ushort RegisterClass(ref WNDCLASS windowClass);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern bool UnregisterClass(string name, IntPtr instance);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr DefWindowProc(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
    [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr GetModuleHandle(string name);

    private static void OnWindowEvent(IntPtr hook, uint eventType, IntPtr window, int objectId, int childId, uint thread, uint time) {
        Interlocked.Increment(ref allEvents);
        if (window == IntPtr.Zero || objectId != 0 || childId != 0) return;
        if (window == controlWindow) Interlocked.Increment(ref controlEvents);
        var className = new StringBuilder(256);
        GetClassName(window, className, className.Capacity);
        string name = className.ToString();
        if (name == "ConsoleWindowClass" || name == "CASCADIA_HOSTING_WINDOW_CLASS") {
            uint process;
            GetWindowThreadProcessId(window, out process);
            terminals.Enqueue(name + " pid=" + process + " hwnd=" + window.ToInt64() + " event=" + eventType);
        }
    }

    public static void Start() {
        var observer = new Thread(() => {
            threadId = GetCurrentThreadId();
            showHook = SetWinEventHook(0x8002, 0x8002, IntPtr.Zero, callback, 0, 0, 0);
            foregroundHook = SetWinEventHook(0x0003, 0x0003, IntPtr.Zero, callback, 0, 0, 0);
            ready.Set();
            MSG message;
            while (GetMessage(out message, IntPtr.Zero, 0, 0) > 0) { }
            if (showHook != IntPtr.Zero) UnhookWinEvent(showHook);
            if (foregroundHook != IntPtr.Zero) UnhookWinEvent(foregroundHook);
        });
        observer.IsBackground = true;
        observer.Start();
        if (!ready.WaitOne(5000) || showHook == IntPtr.Zero || foregroundHook == IntPtr.Zero) throw new Exception("窗口事件监测初始化失败");
    }

    public static void VerifyObserver() {
        // 用屏幕外的同名窗口验证终端事件确实会被拦到，不抢桌面焦点。
        IntPtr instance = GetModuleHandle(null);
        var windowClass = new WNDCLASS { procedure = windowProcedure, instance = instance, name = "ConsoleWindowClass" };
        if (RegisterClass(ref windowClass) == 0) throw new Exception("终端事件验证窗口注册失败");
        IntPtr window = CreateWindowEx(0, windowClass.name, ControlTitle, 0x80000000, -32000, -32000, 1, 1, IntPtr.Zero, IntPtr.Zero, instance, IntPtr.Zero);
        if (window == IntPtr.Zero) {
            UnregisterClass(windowClass.name, instance);
            throw new Exception("终端事件验证窗口创建失败");
        }
        controlWindow = window;
        try {
            ShowWindow(window, 4);
            for (int i = 0; i < 50 && (Volatile.Read(ref controlEvents) == 0 || terminals.IsEmpty); i++) Thread.Sleep(100);
            if (Volatile.Read(ref controlEvents) == 0) throw new Exception("未收到控件窗口事件，事件总数=" + Volatile.Read(ref allEvents) + "，窗口可见=" + IsWindowVisible(window));
            string detected;
            if (!terminals.TryDequeue(out detected) || !detected.StartsWith("ConsoleWindowClass ") || !detected.Contains(" hwnd=" + window.ToInt64() + " ")) throw new Exception("未识别测试终端窗口事件：" + detected);
        } finally {
            DestroyWindow(window);
            UnregisterClass(windowClass.name, instance);
        }
    }

    public static string[] DetectedTerminals() { return terminals.ToArray(); }
    public static void Stop() { if (threadId != 0) PostThreadMessage(threadId, 0x0012, UIntPtr.Zero, IntPtr.Zero); }
}
'@

[BackgroundWindowObserver]::Start()
try {
  [BackgroundWindowObserver]::VerifyObserver()
  $start = [System.Diagnostics.ProcessStartInfo]::new()
  $start.FileName = (Get-Command node -ErrorAction Stop).Source
  $start.Arguments = '--import tsx tests/fixtures/background-desktop.ts'
  $start.WorkingDirectory = (Get-Location).Path
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  $child = [System.Diagnostics.Process]::Start($start)
  $stdout = $child.StandardOutput.ReadToEndAsync()
  $stderr = $child.StandardError.ReadToEndAsync()
  if (-not $child.WaitForExit(120000)) {
    $child.Kill()
    throw '后台隔离流程超时'
  }
  $out = $stdout.GetAwaiter().GetResult()
  $err = $stderr.GetAwaiter().GetResult()
  if ($child.ExitCode -ne 0) { throw "后台隔离流程失败（$($child.ExitCode)）：$err`n$out" }
  Start-Sleep -Milliseconds 500
  $windows = [BackgroundWindowObserver]::DetectedTerminals()
  if ($windows.Count -gt 0) { throw "检测到终端显示或抢焦点：$($windows -join ', ')" }
  Write-Output $out.Trim()
  Write-Output '窗口事件监测通过，隔离流程未显示终端窗口或使终端抢焦点。'
} finally {
  [BackgroundWindowObserver]::Stop()
}
