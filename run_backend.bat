@echo off
echo Starting PFIDS Backend Server...
call backend\venv\Scripts\activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
