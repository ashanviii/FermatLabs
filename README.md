# Reddit RAG Systems 🤖

A comprehensive  Retrieval-Augmented Generation (RAG) system that scrape Reddit posts and provides AI-powered Q&A using OpenAI's GPT models and semantic search.

## 🚀 Feature

- **Multi-Subreddit Support**: Scrapes and processes posts from r/h1b, r/USCIS, r/Indians_StudyAbroad, and r/SchengenVisa
- **Semantic Search**: Uses sentence transformers for finding relevant posts
- **LLM Integration**: OpenAI GPT-3.5-turbo for generating comprehensive answers
- **Interactive Interface**: Persistent session with no reload delays
- **Source Attribution**: Clickable URLs to original Reddit posts
- **Subreddit Filtering**: Focus searches on specific communities
- **Performance Optimized**: Pre-generated embeddings for fast responses

## 📊 Database Stats

- **Total Posts**: 3,044
- **r/h1b**: 941 posts
- **r/USCIS**: 199 posts  
- **r/Indians_StudyAbroad**: 997 posts
- **r/SchengenVisa**: 907 posts

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd reddit-rag-system
```

2. **Create conda environment**
```bash
conda create -n rag python=3.9
conda activate rag
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure API key**
```bash
cp config_template.py config.py
# Edit config.py and add your OpenAI API key
```

## 🎮 Usage

### Interactive Mode (Recommended)
```bash
python simple_rag.py
```

### Single Query Mode
```bash
python rag_query.py "Your question here"
```

### Commands Available
- Ask any question directly
- `filter:h1b` - Focus on H1B visa posts
- `filter:USCIS` - Focus on USCIS posts
- `filter:Indians_StudyAbroad` - Focus on study abroad posts
- `filter:SchengenVisa` - Focus on Schengen visa posts
- `filter:none` - Remove filter
- `stats` - Show database statistics
- `quit`/`exit`/`q` - Exit the program

## 📝 Example Queries

```bash
# H1B related
"What are H1B visa requirements?"
"H1B to green card timeline?"

# USCIS related  
"How to prepare for naturalization interview?"
"What documents needed for citizenship?"

# Study abroad
"Best countries for MS in Computer Science?"
"How to get scholarships for studying abroad?"

# Schengen visa
"Schengen visa requirements for Indians?"
"How long does Schengen visa processing take?"
```

## 🏗️ Architecture

### Core Components

1. **Scrapers** (`*_scraper.py`)
   - Reddit API integration with pagination
   - Rate limiting and error handling
   - Top comment extraction

2. **Embedding Generation** (`generate_embeddings.py`)
   - Sentence transformer embeddings
   - Batch processing for efficiency
   - Separate files per subreddit

3. **RAG System** (`optimized_rag_system.py`)
   - Semantic similarity search
   - LLM integration (OpenAI/Anthropic)
   - Query caching and optimization

4. **Interactive Interface** (`simple_rag.py`)
   - User-friendly command interface
   - Session persistence
   - Real-time responses

### Data Flow
```
Reddit Posts → Scraping → Embedding Generation → Vector Storage → Semantic Search → LLM → Response
```

## 📁 File Structure

```
reddit-rag-system/
├── simple_rag.py              # Interactive interface
├── rag_query.py              # Single query tool
├── optimized_rag_system.py   # Core RAG engine
├── generate_embeddings.py    # Embedding generator
├── config_template.py        # Configuration template
├── config.py                 # Your API keys (create from template)
├── requirements.txt          # Python dependencies
├── scrapers/
│   ├── reddit_scraper.py     # Indians_StudyAbroad scraper
│   ├── h1b_scraper.py        # H1B scraper
│   ├── uscis_scraper.py      # USCIS scraper
│   └── schengen_visa_scraper.py # Schengen scraper
├── data/
│   ├── *_posts_*.json        # Scraped post data
│   └── *_embeddings_*.pkl    # Pre-generated embeddings
└── responses/
    └── rag_response_*.txt    # Saved Q&A sessions
```

## ⚙️ Configuration

Edit `config.py` to customize:

```python
# LLM Provider
LLM_PROVIDER = "openai"  # or "anthropic", "local"
MODEL_NAME = "gpt-3.5-turbo"

# API Keys
OPENAI_API_KEY = "your_openai_api_key_here"

# Performance Settings
SIMILARITY_THRESHOLD = 0.3
TOP_K_RESULTS = 5
MAX_CONTEXT_LENGTH = 4000
```

## 🔄 Data Updates

To refresh data with new Reddit posts:

```bash
# Scrape new posts
python reddit_scraper.py
python h1b_scraper.py  
python uscis_scraper.py
python schengen_visa_scraper.py

# Regenerate embeddings
python generate_embeddings.py

# System will automatically load latest embeddings
```

## 🚨 Rate Limiting

Reddit API has rate limits. The scrapers include:
- Automatic delays between requests
- Error handling for 429 (Too Many Requests)
- Graceful degradation when limits are hit

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is for educational and research purposes. Please respect Reddit's terms of service and API guidelines. Always use reasonable rate limits when scraping.

## 🙏 Acknowledgments

- Reddit for providing the data platform
- OpenAI for the LLM capabilities
- Sentence Transformers for semantic search

- The open-source community for the underlying libraries
