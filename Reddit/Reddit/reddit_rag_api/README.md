# Reddit RAG API

A FastAPI backend for the Reddit RAG (Retrieval-Augmented Generation) system, providing AI-powered Q&A for immigration, visa, and study abroad discussions from Reddit.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up OpenAI API key in `config.py`**

3. **Start the server:**
   ```bash
   # Using the batch file (Windows)
   start_server.bat
   
   # Or directly with uvicorn
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access the API:**
   - Server: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📊 Data Coverage

The system includes **3,044 posts** from:
- **r/h1b**: 941 posts
- **r/SchengenVisa**: 907 posts  
- **r/Indians_StudyAbroad**: 997 posts
- **r/USCIS**: 199 posts

## 🔧 API Endpoints

### 1. Health Check
```
GET /
```
Returns system status and basic stats.

### 2. Query (GET) - Simple Usage
```
GET /query?q=your_question&filter=h1b&max_results=5
```

**Parameters:**
- `q` (required): Your question
- `filter` (optional): Subreddit filter (`h1b`, `USCIS`, `Indians_StudyAbroad`, `SchengenVisa`)
- `max_results` (optional): Number of sources (1-10, default: 5)

**Example:**
```
GET /query?q=How to extend H1B visa?&filter=h1b&max_results=3
```

### 3. Query (POST) - Advanced Usage
```
POST /query
Content-Type: application/json

{
  "query": "How to extend H1B visa?",
  "subreddit_filter": "h1b",
  "max_results": 5
}
```

### 4. System Statistics
```
GET /stats
```
Returns detailed system information and post counts.

## 📤 Response Format

```json
{
  "query": "How to extend H1B visa?",
  "answer": "Based on Reddit discussions, here are the key steps...",
  "sources": [
    {
      "subreddit": "h1b",
      "title": "H1B Extension Process - My Experience",
      "url": "https://reddit.com/r/h1b/comments/...",
      "similarity_score": 0.89,
      "rank": 1
    }
  ],
  "metadata": {
    "total_sources_found": 15,
    "response_time_ms": 1250,
    "model_used": "gpt-3.5-turbo"
  },
  "success": true,
  "error": null
}
```

## 🌐 React Frontend Integration

### Using fetch()
```javascript
// Simple GET request
const response = await fetch(
  `http://localhost:8000/query?q=${encodeURIComponent(question)}&max_results=5`
);
const data = await response.json();

// POST request with JSON
const response = await fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: question,
    subreddit_filter: selectedSubreddit,
    max_results: 5
  })
});
const data = await response.json();
```

### Using axios
```javascript
import axios from 'axios';

// GET request
const response = await axios.get('http://localhost:8000/query', {
  params: {
    q: question,
    filter: 'h1b',
    max_results: 5
  }
});

// POST request
const response = await axios.post('http://localhost:8000/query', {
  query: question,
  subreddit_filter: 'h1b',
  max_results: 5
});
```

## 🛠️ Development

### Project Structure
```
reddit_rag_api/
├── main.py                 # FastAPI application
├── optimized_rag_system.py # Core RAG logic
├── config.py              # Configuration
├── requirements.txt       # Dependencies
├── start_server.bat      # Windows startup script
├── README.md             # This file
└── *_embeddings_*.pkl    # Pre-computed embeddings
```

### Running in Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or with custom port
uvicorn main:app --reload --port 3001
```

## 🔒 Production Deployment

### Environment Variables
Set these for production:
```bash
OPENAI_API_KEY=your_api_key_here
CORS_ORIGINS=https://yourfrontend.com
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 Example Queries

- "How to extend H1B visa?"
- "Schengen visa interview tips"
- "Best universities for MS in US"
- "USCIS processing times"
- "Green card through employer"

## 🚨 Error Handling

The API returns structured error responses:

```json
{
  "query": "your question",
  "answer": "",
  "sources": [],
  "metadata": {},
  "success": false,
  "error": "Detailed error message"
}
```

## 🔧 Configuration

Edit `config.py` to customize:
- OpenAI API settings
- Embedding model
- Response parameters
- Performance settings

## 📊 Performance

- **Cold start**: ~3-5 seconds (loading embeddings)
- **Query response**: ~1-3 seconds
- **Memory usage**: ~2GB (embeddings + model)
- **Concurrent requests**: Supported with async processing