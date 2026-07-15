@echo off
echo Starting PFIDS Application...
start "PFIDS Backend" cmd /c "run_backend.bat"
start "PFIDS Frontend" cmd /c "run_frontend.bat"
echo Both servers have been started.
