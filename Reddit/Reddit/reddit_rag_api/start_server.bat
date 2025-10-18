@echo off
echo 🚀 Starting Reddit RAG API Server...
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo API documentation at: http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload