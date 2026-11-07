Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Check if port 8000 is already active
Set exec = WshShell.Exec("cmd /c netstat -ano | findstr :8000 | findstr LISTENING")
output = exec.StdOut.ReadAll()

If InStr(output, "LISTENING") = 0 Then
    ' Start server in background with completely hidden window (0 = hidden)
    cmdLine = "cmd /c venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000 --noreload"
    WshShell.Run cmdLine, 0, False
End If
