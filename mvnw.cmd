@echo off
cd /d "%~dp0smart-campus-gmu"
if exist "%USERPROFILE%\.maven\apache-maven-3.10.0\bin\mvn.cmd" (
    call "%USERPROFILE%\.maven\apache-maven-3.10.0\bin\mvn.cmd" %*
) else (
    mvn %*
)

