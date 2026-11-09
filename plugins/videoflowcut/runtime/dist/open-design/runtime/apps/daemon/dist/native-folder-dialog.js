function errorCode(error) {
    return error && typeof error === 'object' && 'code' in error
        ? error.code
        : undefined;
}
function errorMessage(error) {
    if (error instanceof Error && error.message)
        return error.message;
    return String(error);
}
function hardLinuxFolderDialogFailure(error, stderrText) {
    const code = errorCode(error);
    if (code === 'ENOENT')
        return 'zenity is not installed';
    if (/cannot open display/i.test(stderrText))
        return stderrText;
    if (/no such file or directory/i.test(stderrText) && /zenity/i.test(stderrText))
        return stderrText;
    return null;
}
const WINDOWS_FOLDER_DIALOG_SCRIPT = [
    'Add-Type -AssemblyName System.Windows.Forms;',
    '$owner = New-Object System.Windows.Forms.Form;',
    "$owner.Text = 'OpenDesign';",
    '$owner.TopMost = $true;',
    '$owner.ShowInTaskbar = $true;',
    "$owner.StartPosition = 'CenterScreen';",
    '$owner.Width = 1;',
    '$owner.Height = 1;',
    '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog;',
    "$dialog.Description = 'Select a code folder to link';",
    '$dialog.ShowNewFolderButton = $true;',
    'try {',
    '  if ($dialog.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.SelectedPath }',
    '} finally {',
    '  $owner.Dispose();',
    '}',
].join(' ');
export function buildWindowsFolderDialogCommand() {
    return {
        command: 'powershell.exe',
        args: ['-NoProfile', '-Sta', '-Command', WINDOWS_FOLDER_DIALOG_SCRIPT],
    };
}
export function parseFolderDialogStdout(error, stdout) {
    if (error) {
        return null;
    }
    const selectedPath = stdout.trim();
    return selectedPath.length > 0 ? selectedPath : null;
}
export function parseLinuxFolderDialogResult(error, stdout, stderr) {
    if (error) {
        const stderrText = stderr.trim();
        const code = errorCode(error);
        const hardFailure = hardLinuxFolderDialogFailure(error, stderrText);
        if (hardFailure) {
            throw new Error(`Could not open folder picker: ${hardFailure}`);
        }
        if (code === 1)
            return null;
        throw new Error(`Could not open folder picker: ${stderrText || errorMessage(error)}`);
    }
    const selectedPath = stdout.trim();
    return selectedPath.length > 0 ? selectedPath : null;
}
//# sourceMappingURL=native-folder-dialog.js.map