# RAG System Configuration
# Copy this file to config.py and add your API keys

# LLM Provider Configuration
LLM_PROVIDER = "openai"  # Options: "openai", "anthropic", "local"
MODEL_NAME = "gpt-3.5-turbo"  # or "gpt-4", "claude-3-sonnet-20240229", etc.

# API Keys (REPLACE WITH YOUR ACTUAL KEYS)
OPENAI_API_KEY = "your_openai_api_key_here"
ANTHROPIC_API_KEY = "your_anthropic_api_key_here"

# Performance Settings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Fast and good quality
MAX_CONTEXT_LENGTH = 4000  # Tokens for LLM context
SIMILARITY_THRESHOLD = 0.3  # Minimum similarity score
TOP_K_RESULTS = 5  # Number of posts to retrieve
BATCH_SIZE = 32  # Embedding batch size
CACHE_ENABLED = True  # Enable query caching

# LLM Settings
MAX_TOKENS = 1000  # Maximum response length
TEMPERATURE = 0.7  # Response creativity (0.0-1.0)

# Optional: Model-specific settings
OPENAI_SETTINGS = {
    "gpt-3.5-turbo": {"max_tokens": 1000, "cost_per_1k": 0.002},
    "gpt-4": {"max_tokens": 1000, "cost_per_1k": 0.03},
    "gpt-4-turbo": {"max_tokens": 2000, "cost_per_1k": 0.01}
}

ANTHROPIC_SETTINGS = {
    "claude-3-sonnet-20240229": {"max_tokens": 1000, "cost_per_1k": 0.015},
    "claude-3-opus-20240229": {"max_tokens": 1000, "cost_per_1k": 0.075}
}