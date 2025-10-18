#!/usr/bin/env python3
"""
Optimized End-to-End RAG System for Reddit Data
Features:
- Fast loading with optimized embeddings
- Multiple LLM provider support (OpenAI, Anthropic, Local models)
- Async processing for better performance
- Caching for repeated queries
- Comprehensive RAG pipeline
"""

import json
import pickle
import numpy as np
import asyncio
import time
from datetime import datetime
from pathlib import Path
import glob
import os
from typing import List, Dict, Tuple, Optional, Any
import re
import hashlib
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import tiktoken
except ImportError:
    logger.info("Installing required packages...")
    import subprocess
    import sys
    
    packages = ['sentence-transformers', 'scikit-learn', 'tiktoken', 'openai', 'anthropic']
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        except:
            logger.warning(f"Failed to install {package}")
    
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import tiktoken

@dataclass
class RAGConfig:
    """Configuration for the RAG system"""
    # Embedding settings
    embedding_model: str = 'all-MiniLM-L6-v2'
    max_context_length: int = 4000
    similarity_threshold: float = 0.3
    
    # LLM settings
    llm_provider: str = 'openai'  # 'openai', 'anthropic', 'local'
    model_name: str = 'gpt-3.5-turbo'
    max_tokens: int = 1000
    temperature: float = 0.7
    
    # Performance settings
    cache_enabled: bool = True
    batch_size: int = 32
    top_k_results: int = 5
    
    # API keys (to be set by user)
    openai_api_key: Optional[str] = None
    # anthropic_api_key: Optional[str] = None  # Commented out - not needed

class LLMProvider:
    """Base class for LLM providers"""
    def __init__(self, config: RAGConfig):
        self.config = config
    
    async def generate_response(self, prompt: str, context: str) -> str:
        raise NotImplementedError

class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider"""
    def __init__(self, config: RAGConfig):
        super().__init__(config)
        try:
            import openai
            self.client = openai.AsyncOpenAI(api_key=config.openai_api_key)
        except ImportError:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
    
    async def generate_response(self, prompt: str, context: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.config.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on Reddit posts about visas, immigration, and study abroad. Use the provided context to give accurate and helpful answers."},
                    {"role": "user", "content": f"Context from Reddit posts:\n{context}\n\nQuestion: {prompt}\n\nPlease provide a comprehensive answer based on the context above."}
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return f"Error generating response: {e}"

# class AnthropicProvider(LLMProvider):
#     """Anthropic Claude LLM provider"""
#     def __init__(self, config: RAGConfig):
#         super().__init__(config)
#         try:
#             import anthropic
#             self.client = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
#         except ImportError:
#             raise ImportError("Anthropic package not installed. Run: pip install anthropic")
#     
#     async def generate_response(self, prompt: str, context: str) -> str:
#         try:
#             response = await self.client.messages.create(
#                 model=self.config.model_name or "claude-3-sonnet-20240229",
#                 max_tokens=self.config.max_tokens,
#                 temperature=self.config.temperature,
#                 messages=[
#                     {
#                         "role": "user", 
#                         "content": f"Based on these Reddit posts about visas and immigration:\n\n{context}\n\nQuestion: {prompt}\n\nPlease provide a helpful answer based on the context."
#                     }
#                 ]
#             )
#             return response.content[0].text
#         except Exception as e:
#             logger.error(f"Anthropic API error: {e}")
#             return f"Error generating response: {e}"

class LocalProvider(LLMProvider):
    """Local/Ollama LLM provider"""
    def __init__(self, config: RAGConfig):
        super().__init__(config)
        # This would integrate with Ollama or other local models
        logger.warning("Local LLM provider not implemented yet")
    
    async def generate_response(self, prompt: str, context: str) -> str:
        # Fallback to a simple template-based response
        return f"Based on the Reddit posts, here's what I found:\n\n{context[:500]}...\n\nNote: This is a template response. Please configure a proper LLM provider."

class QueryCache:
    """Simple in-memory cache for queries"""
    def __init__(self, max_size: int = 100):
        self.cache = {}
        self.max_size = max_size
        self.access_times = {}
    
    def _get_key(self, query: str, subreddit_filter: Optional[str] = None) -> str:
        """Generate cache key"""
        key_data = f"{query}|{subreddit_filter or 'all'}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, query: str, subreddit_filter: Optional[str] = None) -> Optional[Dict]:
        """Get cached result"""
        key = self._get_key(query, subreddit_filter)
        if key in self.cache:
            self.access_times[key] = time.time()
            return self.cache[key]
        return None
    
    def set(self, query: str, result: Dict, subreddit_filter: Optional[str] = None):
        """Cache result"""
        if len(self.cache) >= self.max_size:
            # Remove oldest accessed item
            oldest_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]
        
        key = self._get_key(query, subreddit_filter)
        self.cache[key] = result
        self.access_times[key] = time.time()

class OptimizedRAGSystem:
    """Optimized Reddit RAG System with LLM integration"""
    
    def __init__(self, config: RAGConfig):
        """Initialize the RAG system"""
        self.config = config
        self.posts_data = []
        self.embeddings = None
        self.subreddit_mapping = {}
        self.available_subreddits = set()
        self.cache = QueryCache() if config.cache_enabled else None
        
        # Initialize components
        logger.info("🚀 Initializing Optimized RAG System...")
        self._load_embedding_model()
        self._setup_llm_provider()
        self._setup_tokenizer()
    
    def _load_embedding_model(self):
        """Load embedding model with optimization"""
        logger.info(f"📝 Loading embedding model: {self.config.embedding_model}")
        start_time = time.time()
        
        # Load model with optimization settings
        self.embedding_model = SentenceTransformer(
            self.config.embedding_model,
            device='cpu'  # Use CPU for better compatibility
        )
        
        # Optimize model for inference
        self.embedding_model.eval()
        
        # Set to use multiple threads for better performance
        import torch
        if hasattr(torch, 'set_num_threads'):
            torch.set_num_threads(min(4, os.cpu_count() or 1))
        
        load_time = time.time() - start_time
        logger.info(f"✅ Embedding model loaded in {load_time:.2f}s")
    
    def _setup_llm_provider(self):
        """Setup LLM provider based on config"""
        logger.info(f"🤖 Setting up LLM provider: {self.config.llm_provider}")
        
        if self.config.llm_provider == 'openai':
            if not self.config.openai_api_key:
                logger.warning("OpenAI API key not provided. LLM responses will be limited.")
                self.llm_provider = LocalProvider(self.config)
            else:
                self.llm_provider = OpenAIProvider(self.config)
        # elif self.config.llm_provider == 'anthropic':
        #     if not self.config.anthropic_api_key:
        #         logger.warning("Anthropic API key not provided. LLM responses will be limited.")
        #         self.llm_provider = LocalProvider(self.config)
        #     else:
        #         self.llm_provider = AnthropicProvider(self.config)
        else:
            self.llm_provider = LocalProvider(self.config)
    
    def _setup_tokenizer(self):
        """Setup tokenizer for context length management"""
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except:
            logger.warning("Could not load tiktoken. Context length management will be approximate.")
            self.tokenizer = None
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        else:
            # Approximate: 1 token ≈ 4 characters
            return len(text) // 4
    
    def load_embedding_file(self, filename: str) -> Tuple[List[Dict], np.ndarray, str]:
        """Load embeddings from a pickle file with optimization"""
        try:
            logger.info(f"📂 Loading {os.path.basename(filename)}...")
            start_time = time.time()
            
            with open(filename, 'rb') as f:
                data = pickle.load(f)
            
            posts_data = data.get('posts_data', [])
            embeddings = data.get('embeddings', np.array([]))
            subreddit_name = data.get('subreddit_name', 'unknown')
            
            load_time = time.time() - start_time
            logger.info(f"   ✅ Loaded {len(posts_data):,} posts in {load_time:.2f}s")
            
            return posts_data, embeddings, subreddit_name
            
        except Exception as e:
            logger.error(f"   ❌ Error loading {filename}: {e}")
            return [], np.array([]), "unknown"
    
    def load_all_embeddings(self) -> bool:
        """Load all available pre-generated embeddings with optimization"""
        logger.info("📚 Loading pre-generated embeddings...")
        start_time = time.time()
        
        # Find embedding files
        embedding_patterns = {
            'h1b': 'h1b_embeddings_*.pkl',
            'SchengenVisa': 'schengenvisa_embeddings_*.pkl', 
            'Indians_StudyAbroad': 'indians_studyabroad_embeddings_*.pkl',
            'USCIS': 'uscis_embeddings_*.pkl'
        }
        
        embedding_files = {}
        for subreddit, pattern in embedding_patterns.items():
            files = glob.glob(pattern)
            if files:
                latest_file = max(files, key=os.path.getmtime)
                embedding_files[subreddit] = latest_file
        
        if not embedding_files:
            logger.error("❌ No pre-generated embedding files found!")
            return False
        
        # Load embeddings in parallel (simulated with sequential for now)
        all_posts = []
        all_embeddings = []
        
        for subreddit, filename in embedding_files.items():
            posts, embeddings, subreddit_name = self.load_embedding_file(filename)
            
            if len(posts) > 0 and embeddings.size > 0:
                # Ensure posts have subreddit information
                for post in posts:
                    post['subreddit'] = subreddit_name
                
                all_posts.extend(posts)
                all_embeddings.append(embeddings)
                self.available_subreddits.add(subreddit_name)
        
        if all_embeddings:
            # Combine embeddings efficiently
            self.embeddings = np.vstack(all_embeddings)
            self.posts_data = all_posts
            
            # Create optimized subreddit mapping
            self.subreddit_mapping = {}
            for i, post in enumerate(self.posts_data):
                subreddit = post.get('subreddit', 'unknown')
                if subreddit not in self.subreddit_mapping:
                    self.subreddit_mapping[subreddit] = []
                self.subreddit_mapping[subreddit].append(i)
            
            total_time = time.time() - start_time
            logger.info(f"✅ Loaded {len(self.posts_data):,} posts in {total_time:.2f}s")
            
            # Log statistics
            for subreddit, indices in self.subreddit_mapping.items():
                logger.info(f"   📍 r/{subreddit}: {len(indices):,} posts")
            
            return True
        else:
            logger.error("❌ No valid embeddings loaded!")
            return False
    
    def search_similar_posts(self, query: str, top_k: int = None, subreddit_filter: Optional[str] = None) -> List[Dict]:
        """Optimized similarity search"""
        if top_k is None:
            top_k = self.config.top_k_results
        
        if self.embeddings is None:
            return []
        
        # Check cache first
        if self.cache:
            cached_result = self.cache.get(query, subreddit_filter)
            if cached_result:
                return cached_result[:top_k]  # Return requested number of results
        
        # Generate query embedding
        start_time = time.time()
        query_embedding = self.embedding_model.encode([query])
        embed_time = time.time() - start_time
        
        # Calculate similarities efficiently
        start_time = time.time()
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        sim_time = time.time() - start_time
        
        # Filter by subreddit if specified
        if subreddit_filter and subreddit_filter in self.subreddit_mapping:
            valid_indices = self.subreddit_mapping[subreddit_filter]
            filtered_similarities = [(i, similarities[i]) for i in valid_indices if similarities[i] >= self.config.similarity_threshold]
            top_indices = sorted(filtered_similarities, key=lambda x: x[1], reverse=True)[:top_k]
            top_indices = [idx for idx, _ in top_indices]
        else:
            # Filter by threshold and get top results
            valid_indices = [(i, sim) for i, sim in enumerate(similarities) if sim >= self.config.similarity_threshold]
            top_indices = sorted(valid_indices, key=lambda x: x[1], reverse=True)[:top_k]
            top_indices = [idx for idx, _ in top_indices]
        
        # Prepare results
        results = []
        for rank, idx in enumerate(top_indices, 1):
            post = self.posts_data[idx].copy()
            post['similarity_score'] = float(similarities[idx])
            post['rank'] = rank
            results.append(post)
        
        # Cache results
        if self.cache and results:
            self.cache.set(query, results, subreddit_filter)
        
        logger.debug(f"Search completed: embed={embed_time:.3f}s, similarity={sim_time:.3f}s")
        return results
    
    def _prepare_context(self, similar_posts: List[Dict]) -> str:
        """Prepare context for LLM with token management"""
        context_parts = []
        total_tokens = 0
        
        for i, post in enumerate(similar_posts, 1):
            subreddit = post.get('subreddit', 'unknown')
            title = post.get('title', 'No title')
            content = post.get('content', '')
            top_comment = post.get('top_comment', {})
            
            # Prepare post text
            post_text = f"Post {i} (r/{subreddit}):\n"
            post_text += f"Title: {title}\n"
            
            if content and content.strip():
                post_text += f"Content: {content}\n"
            
            if isinstance(top_comment, dict):
                comment_body = top_comment.get('body', '')
                if comment_body and comment_body not in ['No comments', 'No comments found']:
                    post_text += f"Top Answer: {comment_body}\n"
            
            post_text += "\n" + "-"*50 + "\n\n"
            
            # Check token count
            post_tokens = self._count_tokens(post_text)
            if total_tokens + post_tokens > self.config.max_context_length:
                break
            
            context_parts.append(post_text)
            total_tokens += post_tokens
        
        return "".join(context_parts)
    
    async def generate_rag_response(self, query: str, subreddit_filter: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive RAG response"""
        start_time = time.time()
        
        # 1. Retrieve similar posts
        logger.info(f"🔍 Searching for similar posts...")
        similar_posts = self.search_similar_posts(query, subreddit_filter=subreddit_filter)
        
        if not similar_posts:
            return {
                'query': query,
                'answer': "I couldn't find any relevant posts to answer your question.",
                'sources': [],
                'search_time': time.time() - start_time,
                'subreddit_filter': subreddit_filter
            }
        
        # 2. Prepare context
        context = self._prepare_context(similar_posts)
        context_tokens = self._count_tokens(context)
        
        # 3. Generate LLM response
        logger.info(f"🤖 Generating LLM response...")
        llm_start = time.time()
        try:
            llm_response = await self.llm_provider.generate_response(query, context)
        except Exception as e:
            llm_response = f"Error generating LLM response: {e}"
        llm_time = time.time() - llm_start
        
        # 4. Prepare sources
        sources = []
        for post in similar_posts:
            sources.append({
                'subreddit': post.get('subreddit', 'unknown'),
                'title': post.get('title', 'No title'),
                'url': post.get('url', ''),
                'similarity_score': post.get('similarity_score', 0),
                'rank': post.get('rank', 0)
            })
        
        total_time = time.time() - start_time
        
        return {
            'query': query,
            'answer': llm_response,
            'sources': sources,
            'metadata': {
                'total_time': total_time,
                'llm_time': llm_time,
                'context_tokens': context_tokens,
                'posts_found': len(similar_posts),
                'subreddit_filter': subreddit_filter
            }
        }
    
    def configure_api_keys(self):
        """Interactive API key configuration"""
        print("\n🔑 API Key Configuration")
        print("="*50)
        
        if self.config.llm_provider == 'openai':
            if not self.config.openai_api_key:
                api_key = input("Enter your OpenAI API key (or press Enter to skip): ").strip()
                if api_key:
                    self.config.openai_api_key = api_key
                    self._setup_llm_provider()
                    print("✅ OpenAI API key configured!")
                else:
                    print("⚠️ No API key provided. Using fallback responses.")
        
        # elif self.config.llm_provider == 'anthropic':
        #     if not self.config.anthropic_api_key:
        #         api_key = input("Enter your Anthropic API key (or press Enter to skip): ").strip()
        #         if api_key:
        #             self.config.anthropic_api_key = api_key
        #             self._setup_llm_provider()
        #             print("✅ Anthropic API key configured!")
        #         else:
        #             print("⚠️ No API key provided. Using fallback responses.")
    
    async def interactive_rag_session(self):
        """Interactive RAG session"""
        print("\n" + "="*80)
        print("🤖 OPTIMIZED RAG SYSTEM - Reddit Q&A with LLM")
        print("="*80)
        print(f"📊 Database: {len(self.posts_data):,} posts")
        print(f"🧠 LLM Provider: {self.config.llm_provider}")
        print(f"📝 Model: {self.config.model_name}")
        print(f"🗂️ Subreddits: {', '.join(f'r/{s}' for s in self.available_subreddits)}")
        
        print(f"\n💡 Commands:")
        print("  - Ask any question for AI-powered answers")
        print("  - 'filter:subreddit_name' to focus on specific subreddit")
        print("  - 'config' to change settings")
        print("  - 'stats' for detailed statistics")
        print("  - 'quit', 'exit', or 'q' to exit")
        print("-"*80)
        
        current_filter = None
        
        while True:
            try:
                prompt_prefix = f"[r/{current_filter}]" if current_filter else "[All]"
                user_input = input(f"{prompt_prefix} 💭 Your question: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Thank you for using the RAG system!")
                    break
                
                elif user_input.lower() == 'config':
                    await self._config_menu()
                    continue
                
                elif user_input.lower() == 'stats':
                    self._show_stats()
                    continue
                
                elif user_input.startswith('filter:'):
                    filter_name = user_input[7:].strip()
                    if filter_name.lower() == 'none':
                        current_filter = None
                        print("✅ Filter removed")
                    elif filter_name in self.available_subreddits:
                        current_filter = filter_name
                        print(f"✅ Filter set to r/{filter_name}")
                    else:
                        print(f"❌ Unknown subreddit. Available: {', '.join(self.available_subreddits)}")
                    continue
                
                elif user_input:
                    # Generate RAG response
                    print("🔄 Processing your question...")
                    result = await self.generate_rag_response(user_input, current_filter)
                    
                    # Display response
                    self._display_rag_result(result)
                    
                    # Save result
                    self._save_rag_result(result)
                
                else:
                    print("Please enter a question or command.")
                    
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except EOFError:
                print("\n👋 Session ended!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                print("Please try again or type 'quit' to exit.")
    
    def _display_rag_result(self, result: Dict[str, Any]):
        """Display RAG result in formatted way"""
        print(f"\n🤖 AI Response:")
        print("="*60)
        print(result['answer'])
        
        print(f"\n📚 Sources ({len(result['sources'])} posts):")
        print("-"*40)
        for i, source in enumerate(result['sources'], 1):
            title = source['title'][:60] + "..." if len(source['title']) > 60 else source['title']
            print(f"{i}. r/{source['subreddit']} - {title}")
            print(f"   Similarity: {source['similarity_score']:.3f}")
            
            # Add clickable URL if available
            url = source.get('url', '')
            if url and url.strip():
                # Make URL clickable in terminal (works in most modern terminals)
                print(f"   🔗 Link: {url}")
            else:
                print(f"   🔗 Link: https://reddit.com/r/{source['subreddit']}")
        
        metadata = result.get('metadata', {})
        print(f"\n⚡ Performance:")
        print(f"   Total time: {metadata.get('total_time', 0):.2f}s")
        print(f"   LLM time: {metadata.get('llm_time', 0):.2f}s")
        print(f"   Context tokens: {metadata.get('context_tokens', 0):,}")
        print(f"   Posts analyzed: {metadata.get('posts_found', 0)}")
        print("-"*60)
    
    def _save_rag_result(self, result: Dict[str, Any]):
        """Save RAG result to file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"rag_response_{timestamp}.txt"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("OPTIMIZED RAG SYSTEM RESPONSE\n")
            f.write("="*50 + "\n\n")
            f.write(f"Query: {result['query']}\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("AI RESPONSE:\n")
            f.write("-"*20 + "\n")
            f.write(result['answer'])
            f.write("\n\n")
            
            f.write("SOURCES:\n")
            f.write("-"*20 + "\n")
            for i, source in enumerate(result['sources'], 1):
                f.write(f"{i}. r/{source['subreddit']}: {source['title']}\n")
                f.write(f"   Similarity: {source['similarity_score']:.3f}\n")
                url = source.get('url', '')
                if url and url.strip():
                    f.write(f"   🔗 URL: {url}\n")
                else:
                    f.write(f"   🔗 URL: https://reddit.com/r/{source['subreddit']}\n")
                f.write("\n")
            
            metadata = result.get('metadata', {})
            f.write("METADATA:\n")
            f.write("-"*20 + "\n")
            for key, value in metadata.items():
                f.write(f"{key}: {value}\n")
    
    async def _config_menu(self):
        """Configuration menu"""
        print("\n⚙️ Configuration Menu")
        print("1. Change LLM provider")
        print("2. Configure API keys") 
        print("3. Adjust similarity threshold")
        print("4. Change number of results")
        print("5. Back to main menu")
        
        choice = input("Select option (1-5): ").strip()
        
        if choice == '1':
            print("Available providers: openai, local")
            provider = input("Enter provider: ").strip().lower()
            if provider in ['openai', 'local']:  # removed 'anthropic'
                self.config.llm_provider = provider
                self._setup_llm_provider()
                print(f"✅ Provider changed to {provider}")
            else:
                print("❌ Invalid provider")
        
        elif choice == '2':
            self.configure_api_keys()
        
        elif choice == '3':
            try:
                threshold = float(input(f"Current threshold: {self.config.similarity_threshold}. Enter new value (0.0-1.0): "))
                if 0.0 <= threshold <= 1.0:
                    self.config.similarity_threshold = threshold
                    print(f"✅ Threshold set to {threshold}")
                else:
                    print("❌ Threshold must be between 0.0 and 1.0")
            except ValueError:
                print("❌ Invalid number")
        
        elif choice == '4':
            try:
                k = int(input(f"Current top_k: {self.config.top_k_results}. Enter new value: "))
                if k > 0:
                    self.config.top_k_results = k
                    print(f"✅ Top-k set to {k}")
                else:
                    print("❌ Must be positive number")
            except ValueError:
                print("❌ Invalid number")
    
    def _show_stats(self):
        """Show detailed statistics"""
        print(f"\n📊 System Statistics")
        print("="*50)
        print(f"Total posts: {len(self.posts_data):,}")
        print(f"Embedding dimensions: {self.embeddings.shape[1] if self.embeddings is not None else 'N/A'}")
        print(f"Cache size: {len(self.cache.cache) if self.cache else 'Disabled'}")
        print(f"Similarity threshold: {self.config.similarity_threshold}")
        print(f"Top-k results: {self.config.top_k_results}")
        
        print(f"\nSubreddit breakdown:")
        for subreddit in sorted(self.available_subreddits):
            count = len(self.subreddit_mapping.get(subreddit, []))
            percentage = (count / len(self.posts_data)) * 100
            print(f"  r/{subreddit}: {count:,} posts ({percentage:.1f}%)")

def load_config() -> RAGConfig:
    """Load configuration from file or use defaults"""
    try:
        # Try to load from config.py
        import config
        return RAGConfig(
            llm_provider=getattr(config, 'LLM_PROVIDER', 'openai'),
            embedding_model=getattr(config, 'EMBEDDING_MODEL', 'all-MiniLM-L6-v2'),
            model_name=getattr(config, 'MODEL_NAME', 'gpt-3.5-turbo'),
            max_tokens=getattr(config, 'MAX_TOKENS', 1000),
            temperature=getattr(config, 'TEMPERATURE', 0.7),
            max_context_length=getattr(config, 'MAX_CONTEXT_LENGTH', 4000),
            similarity_threshold=getattr(config, 'SIMILARITY_THRESHOLD', 0.3),
            top_k_results=getattr(config, 'TOP_K_RESULTS', 5),
            batch_size=getattr(config, 'BATCH_SIZE', 32),
            cache_enabled=getattr(config, 'CACHE_ENABLED', True),
            openai_api_key=getattr(config, 'OPENAI_API_KEY', None),
            # anthropic_api_key=getattr(config, 'ANTHROPIC_API_KEY', None)  # Commented out - not needed
        )
    except ImportError:
        logger.info("No config.py found, using defaults. Copy config_template.py to config.py to customize.")
        return RAGConfig()

async def main():
    """Main function"""
    # Load configuration
    config = load_config()
    
    print("🚀 Starting Optimized RAG System...")
    
    # Initialize system
    rag_system = OptimizedRAGSystem(config)
    
    # Load embeddings
    if not rag_system.load_all_embeddings():
        print("❌ Failed to load embeddings!")
        print("💡 Run 'python generate_embeddings.py' first.")
        return
    
    # Configure API keys
    rag_system.configure_api_keys()
    
    # Start interactive session
    await rag_system.interactive_rag_session()

if __name__ == "__main__":
    asyncio.run(main())