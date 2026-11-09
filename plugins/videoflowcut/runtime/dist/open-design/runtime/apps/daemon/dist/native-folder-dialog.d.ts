export interface NativeFolderDialogCommand {
    command: string;
    args: string[];
}
export declare function buildWindowsFolderDialogCommand(): NativeFolderDialogCommand;
export declare function parseFolderDialogStdout(error: unknown, stdout: string): string | null;
export declare function parseLinuxFolderDialogResult(error: unknown, stdout: string, stderr: string): string | null;
