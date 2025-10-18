"""
FastAPI Backend for Reddit RAG System
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import sys
import os
import logging

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from optimized_rag_system import load_config, OptimizedRAGSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Reddit RAG API",
    description="AI-powered Q&A system for Reddit immigration/visa discussions",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG system instance
rag_system: Optional[OptimizedRAGSystem] = None

# Request/Response models
class QueryRequest(BaseModel):
    query: str
    subreddit_filter: Optional[str] = None
    max_results: Optional[int] = 5

class Source(BaseModel):
    subreddit: str
    title: str
    url: str
    similarity_score: float
    rank: int

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[Source]
    metadata: Dict[str, Any]
    success: bool = True
    error: Optional[str] = None

class StatsResponse(BaseModel):
    total_posts: int
    subreddits: Dict[str, int]
    available_filters: List[str]
    model_info: Dict[str, str]

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the RAG system on startup"""
    global rag_system
    
    try:
        logger.info("🚀 Initializing Reddit RAG System...")
        
        # Load configuration
        config = load_config()
        logger.info("✅ Config loaded")
        
        # Initialize RAG system
        rag_system = OptimizedRAGSystem(config)
        logger.info("✅ RAG system initialized")
        
        # Load embeddings
        if not rag_system.load_all_embeddings():
            raise Exception("Failed to load embeddings")
        
        logger.info(f"✅ Loaded {len(rag_system.posts_data):,} posts from {len(rag_system.available_subreddits)} subreddits")
        logger.info("🎉 Reddit RAG API is ready!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize RAG system: {e}")
        raise

# Health check endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    return {
        "message": "Reddit RAG API is running!",
        "status": "healthy",
        "total_posts": len(rag_system.posts_data),
        "subreddits": list(rag_system.available_subreddits)
    }

# Main query endpoint
@app.get("/query", response_model=QueryResponse)
async def query_endpoint(
    q: str = Query(..., description="The question to ask"),
    filter: Optional[str] = Query(None, description="Subreddit filter (h1b, USCIS, Indians_StudyAbroad, SchengenVisa)"),
    max_results: Optional[int] = Query(5, description="Maximum number of sources to return")
):
    """
    Main endpoint to query the RAG system
    
    - **q**: Your question about visas, immigration, or study abroad
    - **filter**: Optional subreddit filter to focus search
    - **max_results**: Number of source posts to return (1-10)
    """
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        # Validate inputs
        if not q.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if max_results and (max_results < 1 or max_results > 10):
            raise HTTPException(status_code=400, detail="max_results must be between 1 and 10")
        
        if filter and filter not in rag_system.available_subreddits:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid filter. Available: {', '.join(rag_system.available_subreddits)}"
            )
        
        # Update config for this request
        if max_results:
            rag_system.config.top_k_results = max_results
        
        # Generate response
        logger.info(f"Processing query: {q[:50]}...")
        result = await rag_system.generate_rag_response(q, filter)
        
        # Format response
        sources = [
            Source(
                subreddit=source['subreddit'],
                title=source['title'],
                url=source['url'],
                similarity_score=source['similarity_score'],
                rank=source['rank']
            )
            for source in result['sources']
        ]
        
        return QueryResponse(
            query=result['query'],
            answer=result['answer'],
            sources=sources,
            metadata=result['metadata']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        return QueryResponse(
            query=q,
            answer="",
            sources=[],
            metadata={},
            success=False,
            error=str(e)
        )

# POST endpoint for complex queries
@app.post("/query", response_model=QueryResponse)
async def query_post_endpoint(request: QueryRequest):
    """
    POST endpoint for complex queries with JSON body
    """
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        # Validate inputs
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if request.max_results and (request.max_results < 1 or request.max_results > 10):
            raise HTTPException(status_code=400, detail="max_results must be between 1 and 10")
        
        if request.subreddit_filter and request.subreddit_filter not in rag_system.available_subreddits:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid subreddit_filter. Available: {', '.join(rag_system.available_subreddits)}"
            )
        
        # Update config for this request
        if request.max_results:
            rag_system.config.top_k_results = request.max_results
        
        # Generate response
        logger.info(f"Processing POST query: {request.query[:50]}...")
        result = await rag_system.generate_rag_response(request.query, request.subreddit_filter)
        
        # Format response
        sources = [
            Source(
                subreddit=source['subreddit'],
                title=source['title'],
                url=source['url'],
                similarity_score=source['similarity_score'],
                rank=source['rank']
            )
            for source in result['sources']
        ]
        
        return QueryResponse(
            query=result['query'],
            answer=result['answer'],
            sources=sources,
            metadata=result['metadata']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing POST query: {e}")
        return QueryResponse(
            query=request.query,
            answer="",
            sources=[],
            metadata={},
            success=False,
            error=str(e)
        )

# Stats endpoint
@app.get("/stats", response_model=StatsResponse)
async def stats_endpoint():
    """Get system statistics"""
    if rag_system is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    # Calculate subreddit stats
    subreddit_stats = {}
    for subreddit in rag_system.available_subreddits:
        count = len(rag_system.subreddit_mapping.get(subreddit, []))
        subreddit_stats[subreddit] = count
    
    return StatsResponse(
        total_posts=len(rag_system.posts_data),
        subreddits=subreddit_stats,
        available_filters=list(rag_system.available_subreddits),
        model_info={
            "embedding_model": rag_system.config.embedding_model,
            "llm_provider": rag_system.config.llm_provider,
            "llm_model": rag_system.config.model_name
        }
    )

# Error handlers
@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )