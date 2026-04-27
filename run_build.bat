@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\saura\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%

echo JAVA_HOME=%JAVA_HOME%
java -version
echo.
echo Starting Gradle build...
cd /d D:\padmai\padmai-mobile\android
call gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
echo Exit code: %ERRORLEVEL%
