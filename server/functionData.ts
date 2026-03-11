// Complete registry of 80+ API functions for KIMI SWARM
export const FUNCTION_REGISTRY_DATA = [
  // ─── LLM ───────────────────────────────────────────────────────────────────
  {
    name: "openai-gpt4o",
    displayName: "OpenAI GPT-4o",
    category: "llm" as const,
    provider: "OpenAI",
    description: "Most capable multimodal model. Handles text, images, audio. Best for complex reasoning and instruction following.",
    endpoint: "https://api.openai.com/v1/chat/completions",
    costPer1k: 0.005,
    costUnit: "per 1K output tokens",
    tags: ["multimodal", "reasoning", "flagship"],
  },
  {
    name: "openai-gpt4o-mini",
    displayName: "OpenAI GPT-4o Mini",
    category: "llm" as const,
    provider: "OpenAI",
    description: "Fast, affordable small model for focused tasks. 128K context window. Excellent cost/performance ratio.",
    endpoint: "https://api.openai.com/v1/chat/completions",
    costPer1k: 0.00015,
    costUnit: "per 1K output tokens",
    tags: ["fast", "cheap", "128k-context"],
  },
  {
    name: "openai-o3-mini",
    displayName: "OpenAI o3-mini",
    category: "llm" as const,
    provider: "OpenAI",
    description: "Advanced reasoning model optimized for STEM tasks. Excels at math, science, coding with chain-of-thought.",
    endpoint: "https://api.openai.com/v1/chat/completions",
    costPer1k: 0.0011,
    costUnit: "per 1K output tokens",
    tags: ["reasoning", "math", "coding", "stem"],
  },
  {
    name: "anthropic-claude-35-sonnet",
    displayName: "Anthropic Claude 3.5 Sonnet",
    category: "llm" as const,
    provider: "Anthropic",
    description: "Exceptional at coding, analysis, and nuanced writing. 200K context. Best for agentic tasks.",
    endpoint: "https://api.anthropic.com/v1/messages",
    costPer1k: 0.015,
    costUnit: "per 1K output tokens",
    tags: ["coding", "analysis", "200k-context", "agentic"],
  },
  {
    name: "anthropic-claude-3-haiku",
    displayName: "Anthropic Claude 3 Haiku",
    category: "llm" as const,
    provider: "Anthropic",
    description: "Fastest and most compact Claude model. Near-instant responsiveness for lightweight tasks.",
    endpoint: "https://api.anthropic.com/v1/messages",
    costPer1k: 0.00025,
    costUnit: "per 1K output tokens",
    tags: ["fast", "cheap", "lightweight"],
  },
  {
    name: "kimi-k25",
    displayName: "KIMI K2.5",
    category: "llm" as const,
    provider: "Moonshot AI",
    description: "KIMI K2.5 — primary orchestrator for this swarm. 128K context, exceptional at tool use and autonomous workflows.",
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    costPer1k: 0.002,
    costUnit: "per 1K output tokens",
    tags: ["orchestrator", "tool-use", "autonomous", "128k"],
  },
  {
    name: "deepseek-r1",
    displayName: "DeepSeek R1",
    category: "llm" as const,
    provider: "DeepSeek",
    description: "Open-source reasoning model matching o1. Excellent for math, code, and logical reasoning at low cost.",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    costPer1k: 0.00055,
    costUnit: "per 1K output tokens",
    tags: ["reasoning", "open-source", "math", "cheap"],
  },
  {
    name: "deepseek-v3",
    displayName: "DeepSeek V3",
    category: "llm" as const,
    provider: "DeepSeek",
    description: "Mixture-of-Experts model with 671B total parameters. Exceptional coding and knowledge tasks.",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    costPer1k: 0.00028,
    costUnit: "per 1K output tokens",
    tags: ["moe", "coding", "knowledge", "cheap"],
  },
  {
    name: "google-gemini-15-pro",
    displayName: "Google Gemini 1.5 Pro",
    category: "llm" as const,
    provider: "Google",
    description: "1M context window. Handles entire codebases, long documents, and hour-long videos in a single prompt.",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    costPer1k: 0.007,
    costUnit: "per 1K output tokens",
    tags: ["1m-context", "multimodal", "long-context"],
  },
  {
    name: "google-gemini-flash",
    displayName: "Google Gemini 2.0 Flash",
    category: "llm" as const,
    provider: "Google",
    description: "Next-gen speed and efficiency. Multimodal with native tool use. Best for high-volume applications.",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    costPer1k: 0.0004,
    costUnit: "per 1K output tokens",
    tags: ["fast", "multimodal", "tool-use", "cheap"],
  },
  {
    name: "meta-llama-3-70b",
    displayName: "Meta Llama 3 70B",
    category: "llm" as const,
    provider: "Meta / Groq",
    description: "Open-source 70B model via Groq. Ultra-fast inference (300+ tokens/sec). Great for production workloads.",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    costPer1k: 0.00059,
    costUnit: "per 1K output tokens",
    tags: ["open-source", "fast", "groq", "production"],
  },
  {
    name: "mistral-large",
    displayName: "Mistral Large",
    category: "llm" as const,
    provider: "Mistral AI",
    description: "Top-tier reasoning, multilingual, and code generation. 128K context. Excellent for European deployments.",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    costPer1k: 0.006,
    costUnit: "per 1K output tokens",
    tags: ["multilingual", "coding", "128k", "european"],
  },
  {
    name: "cohere-command-r-plus",
    displayName: "Cohere Command R+",
    category: "llm" as const,
    provider: "Cohere",
    description: "Optimized for RAG and enterprise use cases. Built-in grounding and citation capabilities.",
    endpoint: "https://api.cohere.ai/v1/chat",
    costPer1k: 0.003,
    costUnit: "per 1K output tokens",
    tags: ["rag", "enterprise", "grounding", "citations"],
  },
  // ─── IMAGE ─────────────────────────────────────────────────────────────────
  {
    name: "openai-dall-e-3",
    displayName: "OpenAI DALL-E 3",
    category: "image" as const,
    provider: "OpenAI",
    description: "State-of-the-art text-to-image. Follows complex prompts precisely. 1024x1024 to 1792x1024.",
    endpoint: "https://api.openai.com/v1/images/generations",
    costPer1k: 40,
    costUnit: "per 1K images (HD)",
    tags: ["text-to-image", "hd", "precise"],
  },
  {
    name: "stability-sdxl",
    displayName: "Stability AI SDXL",
    category: "image" as const,
    provider: "Stability AI",
    description: "High-resolution image generation with fine-grained control. Supports ControlNet and LoRA.",
    endpoint: "https://api.stability.ai/v1/generation",
    costPer1k: 0.002,
    costUnit: "per image",
    tags: ["sdxl", "controlnet", "lora", "high-res"],
  },
  {
    name: "stability-sd3",
    displayName: "Stability AI SD3",
    category: "image" as const,
    provider: "Stability AI",
    description: "Next-gen Stable Diffusion with improved text rendering and photorealism. 1M parameter transformer.",
    endpoint: "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    costPer1k: 0.065,
    costUnit: "per image",
    tags: ["sd3", "photorealistic", "text-rendering"],
  },
  {
    name: "midjourney-api",
    displayName: "Midjourney (via API)",
    category: "image" as const,
    provider: "Midjourney",
    description: "Industry-leading artistic image generation. Exceptional for creative and stylized outputs.",
    endpoint: "https://api.midjourney.com/v1/imagine",
    costPer1k: 0.08,
    costUnit: "per image",
    tags: ["artistic", "creative", "stylized"],
  },
  {
    name: "replicate-flux-pro",
    displayName: "Flux Pro (Replicate)",
    category: "image" as const,
    provider: "Black Forest Labs / Replicate",
    description: "State-of-the-art image generation with exceptional prompt adherence and photorealism.",
    endpoint: "https://api.replicate.com/v1/models/black-forest-labs/flux-pro",
    costPer1k: 0.055,
    costUnit: "per image",
    tags: ["flux", "photorealistic", "prompt-adherence"],
  },
  {
    name: "google-imagen3",
    displayName: "Google Imagen 3",
    category: "image" as const,
    provider: "Google",
    description: "Google's highest quality text-to-image model. Exceptional detail, lighting, and artifact reduction.",
    endpoint: "https://us-central1-aiplatform.googleapis.com/v1/projects",
    costPer1k: 0.04,
    costUnit: "per image",
    tags: ["google", "high-quality", "detail"],
  },
  {
    name: "fal-ai-aura-flow",
    displayName: "AuraFlow (fal.ai)",
    category: "image" as const,
    provider: "fal.ai",
    description: "Open-source flow-matching model. Fast generation with high quality. Great for batch processing.",
    endpoint: "https://fal.run/fal-ai/aura-flow",
    costPer1k: 0.003,
    costUnit: "per image",
    tags: ["open-source", "fast", "batch"],
  },
  {
    name: "openai-gpt4o-vision",
    displayName: "GPT-4o Vision",
    category: "image" as const,
    provider: "OpenAI",
    description: "Analyze and understand images. Extract text, describe scenes, answer questions about visual content.",
    endpoint: "https://api.openai.com/v1/chat/completions",
    costPer1k: 0.00765,
    costUnit: "per 1K tokens (image input)",
    tags: ["vision", "ocr", "analysis", "multimodal"],
  },
  // ─── VIDEO ─────────────────────────────────────────────────────────────────
  {
    name: "runway-gen3",
    displayName: "Runway Gen-3 Alpha",
    category: "video" as const,
    provider: "Runway",
    description: "Text-to-video and image-to-video. 10s clips at 24fps. Exceptional motion quality and consistency.",
    endpoint: "https://api.dev.runwayml.com/v1/image_to_video",
    costPer1k: 0.05,
    costUnit: "per second of video",
    tags: ["text-to-video", "image-to-video", "24fps"],
  },
  {
    name: "pika-labs-v2",
    displayName: "Pika Labs 2.0",
    category: "video" as const,
    provider: "Pika Labs",
    description: "AI video generation with precise motion control. Supports lip sync, sound effects, and style transfer.",
    endpoint: "https://api.pika.art/v1/generate",
    costPer1k: 0.08,
    costUnit: "per video",
    tags: ["motion-control", "lip-sync", "style-transfer"],
  },
  {
    name: "kling-ai-video",
    displayName: "Kling AI Video",
    category: "video" as const,
    provider: "Kuaishou",
    description: "High-quality video generation with realistic physics simulation. Up to 2 minutes of video.",
    endpoint: "https://api.klingai.com/v1/videos/text2video",
    costPer1k: 0.14,
    costUnit: "per 5s video",
    tags: ["physics", "long-video", "realistic"],
  },
  {
    name: "sora-api",
    displayName: "OpenAI Sora",
    category: "video" as const,
    provider: "OpenAI",
    description: "World-model video generation. Creates complex scenes with consistent physics and cinematography.",
    endpoint: "https://api.openai.com/v1/video/generations",
    costPer1k: 0.15,
    costUnit: "per second of video",
    tags: ["world-model", "cinematography", "physics"],
  },
  {
    name: "heygen-avatar",
    displayName: "HeyGen Avatar Video",
    category: "video" as const,
    provider: "HeyGen",
    description: "AI avatar video generation with lip sync. Create talking head videos from text in 40+ languages.",
    endpoint: "https://api.heygen.com/v2/video/generate",
    costPer1k: 0.3,
    costUnit: "per minute",
    tags: ["avatar", "lip-sync", "multilingual", "talking-head"],
  },
  {
    name: "luma-dream-machine",
    displayName: "Luma Dream Machine",
    category: "video" as const,
    provider: "Luma AI",
    description: "Photorealistic video generation from text and images. Exceptional camera motion and lighting.",
    endpoint: "https://api.lumalabs.ai/dream-machine/v1/generations",
    costPer1k: 0.019,
    costUnit: "per second of video",
    tags: ["photorealistic", "camera-motion", "lighting"],
  },
  // ─── AUDIO ─────────────────────────────────────────────────────────────────
  {
    name: "openai-tts-hd",
    displayName: "OpenAI TTS HD",
    category: "audio" as const,
    provider: "OpenAI",
    description: "High-quality text-to-speech with 6 voices. Optimized for quality. Supports speed control.",
    endpoint: "https://api.openai.com/v1/audio/speech",
    costPer1k: 0.03,
    costUnit: "per 1K characters",
    tags: ["tts", "hd", "6-voices"],
  },
  {
    name: "openai-whisper",
    displayName: "OpenAI Whisper",
    category: "audio" as const,
    provider: "OpenAI",
    description: "State-of-the-art speech recognition. 99 languages. Handles accents, background noise, technical jargon.",
    endpoint: "https://api.openai.com/v1/audio/transcriptions",
    costPer1k: 0.006,
    costUnit: "per minute",
    tags: ["stt", "transcription", "99-languages"],
  },
  {
    name: "elevenlabs-tts",
    displayName: "ElevenLabs TTS",
    category: "audio" as const,
    provider: "ElevenLabs",
    description: "Ultra-realistic voice synthesis with emotion control. Clone voices, multilingual, real-time streaming.",
    endpoint: "https://api.elevenlabs.io/v1/text-to-speech",
    costPer1k: 0.3,
    costUnit: "per 1K characters",
    tags: ["voice-clone", "emotion", "streaming", "realistic"],
  },
  {
    name: "elevenlabs-voice-clone",
    displayName: "ElevenLabs Voice Clone",
    category: "audio" as const,
    provider: "ElevenLabs",
    description: "Clone any voice from 1 minute of audio. Professional voice cloning for personalized TTS.",
    endpoint: "https://api.elevenlabs.io/v1/voices/add",
    costPer1k: 1.0,
    costUnit: "per clone",
    tags: ["voice-clone", "personalization"],
  },
  {
    name: "suno-music-gen",
    displayName: "Suno Music Generation",
    category: "audio" as const,
    provider: "Suno",
    description: "AI music generation with vocals and instruments. Create full songs from text descriptions.",
    endpoint: "https://api.suno.com/v1/generate",
    costPer1k: 0.1,
    costUnit: "per song",
    tags: ["music", "vocals", "instruments", "generation"],
  },
  {
    name: "udio-music",
    displayName: "Udio Music",
    category: "audio" as const,
    provider: "Udio",
    description: "High-fidelity AI music generation. Exceptional at specific genres and styles with lyrics.",
    endpoint: "https://api.udio.com/v1/generate",
    costPer1k: 0.12,
    costUnit: "per song",
    tags: ["music", "high-fidelity", "genres", "lyrics"],
  },
  {
    name: "assemblyai-transcription",
    displayName: "AssemblyAI Transcription",
    category: "audio" as const,
    provider: "AssemblyAI",
    description: "Advanced speech-to-text with speaker diarization, sentiment analysis, and auto-chapters.",
    endpoint: "https://api.assemblyai.com/v2/transcript",
    costPer1k: 0.0065,
    costUnit: "per minute",
    tags: ["transcription", "diarization", "sentiment", "chapters"],
  },
  {
    name: "deepgram-nova",
    displayName: "Deepgram Nova-2",
    category: "audio" as const,
    provider: "Deepgram",
    description: "Real-time speech recognition API. 30+ languages, streaming support, word-level timestamps.",
    endpoint: "https://api.deepgram.com/v1/listen",
    costPer1k: 0.0043,
    costUnit: "per minute",
    tags: ["real-time", "streaming", "timestamps", "30-languages"],
  },
  // ─── SEARCH ────────────────────────────────────────────────────────────────
  {
    name: "perplexity-sonar",
    displayName: "Perplexity Sonar",
    category: "search" as const,
    provider: "Perplexity",
    description: "Real-time web search with AI synthesis. Returns cited, up-to-date answers with source URLs.",
    endpoint: "https://api.perplexity.ai/chat/completions",
    costPer1k: 0.001,
    costUnit: "per query",
    tags: ["web-search", "citations", "real-time", "synthesis"],
  },
  {
    name: "perplexity-sonar-pro",
    displayName: "Perplexity Sonar Pro",
    category: "search" as const,
    provider: "Perplexity",
    description: "Advanced search with deeper research, more sources, and better reasoning over search results.",
    endpoint: "https://api.perplexity.ai/chat/completions",
    costPer1k: 0.003,
    costUnit: "per query",
    tags: ["deep-research", "multi-source", "advanced"],
  },
  {
    name: "tavily-search",
    displayName: "Tavily Search",
    category: "search" as const,
    provider: "Tavily",
    description: "AI-optimized search API built for LLM agents. Returns structured results with relevance scores.",
    endpoint: "https://api.tavily.com/search",
    costPer1k: 0.004,
    costUnit: "per query",
    tags: ["agent-optimized", "structured", "relevance-scores"],
  },
  {
    name: "serper-google",
    displayName: "Serper Google Search",
    category: "search" as const,
    provider: "Serper",
    description: "Real-time Google search results via API. News, images, maps, shopping. 2500 free queries/month.",
    endpoint: "https://google.serper.dev/search",
    costPer1k: 0.001,
    costUnit: "per query",
    tags: ["google", "real-time", "news", "images"],
  },
  {
    name: "brave-search",
    displayName: "Brave Search API",
    category: "search" as const,
    provider: "Brave",
    description: "Independent search index. Privacy-focused with AI summaries. No Google dependency.",
    endpoint: "https://api.search.brave.com/res/v1/web/search",
    costPer1k: 0.003,
    costUnit: "per query",
    tags: ["independent", "privacy", "ai-summaries"],
  },
  {
    name: "exa-semantic-search",
    displayName: "Exa Semantic Search",
    category: "search" as const,
    provider: "Exa",
    description: "Neural search engine for the web. Find semantically similar content, not just keyword matches.",
    endpoint: "https://api.exa.ai/search",
    costPer1k: 0.005,
    costUnit: "per query",
    tags: ["semantic", "neural", "similarity"],
  },
  {
    name: "you-com-search",
    displayName: "You.com Research API",
    category: "search" as const,
    provider: "You.com",
    description: "AI-powered research with multi-step reasoning. Synthesizes information from multiple sources.",
    endpoint: "https://api.you.com/search",
    costPer1k: 0.002,
    costUnit: "per query",
    tags: ["research", "multi-step", "synthesis"],
  },
  // ─── CODE ──────────────────────────────────────────────────────────────────
  {
    name: "github-copilot-api",
    displayName: "GitHub Copilot API",
    category: "code" as const,
    provider: "GitHub / OpenAI",
    description: "AI pair programmer. Code completion, generation, and explanation across 70+ languages.",
    endpoint: "https://api.githubcopilot.com/chat/completions",
    costPer1k: 0.01,
    costUnit: "per 1K tokens",
    tags: ["code-completion", "70-languages", "pair-programmer"],
  },
  {
    name: "e2b-code-interpreter",
    displayName: "E2B Code Interpreter",
    category: "code" as const,
    provider: "E2B",
    description: "Sandboxed code execution environment. Run Python, JS, and more in isolated containers.",
    endpoint: "https://api.e2b.dev/v1/sandboxes",
    costPer1k: 0.1,
    costUnit: "per hour of sandbox",
    tags: ["sandbox", "execution", "python", "javascript"],
  },
  {
    name: "replit-ghostwriter",
    displayName: "Replit Ghostwriter",
    category: "code" as const,
    provider: "Replit",
    description: "AI coding assistant with complete project understanding. Generates, explains, and transforms code.",
    endpoint: "https://api.replit.com/v1/ai/complete",
    costPer1k: 0.008,
    costUnit: "per 1K tokens",
    tags: ["project-aware", "generation", "transformation"],
  },
  {
    name: "codeium-api",
    displayName: "Codeium API",
    category: "code" as const,
    provider: "Codeium",
    description: "Free AI code completion and chat. Supports 70+ languages with context-aware suggestions.",
    endpoint: "https://api.codeium.com/complete",
    costPer1k: 0,
    costUnit: "free tier available",
    tags: ["free", "code-completion", "context-aware"],
  },
  {
    name: "anthropic-claude-code",
    displayName: "Claude for Code",
    category: "code" as const,
    provider: "Anthropic",
    description: "Claude 3.5 Sonnet optimized for coding. Best at understanding large codebases and complex refactoring.",
    endpoint: "https://api.anthropic.com/v1/messages",
    costPer1k: 0.015,
    costUnit: "per 1K output tokens",
    tags: ["codebase-understanding", "refactoring", "complex"],
  },
  {
    name: "vercel-v0",
    displayName: "Vercel v0 API",
    category: "code" as const,
    provider: "Vercel",
    description: "Generate React/Next.js UI components from text descriptions. Tailwind CSS + shadcn/ui output.",
    endpoint: "https://api.v0.dev/v1/generate",
    costPer1k: 0.02,
    costUnit: "per generation",
    tags: ["react", "nextjs", "ui-generation", "tailwind"],
  },
  // ─── DATABASE ──────────────────────────────────────────────────────────────
  {
    name: "supabase-pgvector",
    displayName: "Supabase pgvector",
    category: "database" as const,
    provider: "Supabase",
    description: "Vector similarity search in PostgreSQL. Store OpenAI embeddings (1536d) and run semantic queries.",
    endpoint: "https://{project}.supabase.co/rest/v1/rpc/match_functions",
    costPer1k: 0,
    costUnit: "included in Supabase plan",
    tags: ["vector-search", "postgresql", "embeddings", "semantic"],
  },
  {
    name: "pinecone-vector-db",
    displayName: "Pinecone Vector DB",
    category: "database" as const,
    provider: "Pinecone",
    description: "Managed vector database for production ML applications. Billions of vectors, low-latency queries.",
    endpoint: "https://{index}.svc.{env}.pinecone.io",
    costPer1k: 0.096,
    costUnit: "per month (1M vectors)",
    tags: ["managed", "production", "low-latency", "scalable"],
  },
  {
    name: "weaviate-cloud",
    displayName: "Weaviate Cloud",
    category: "database" as const,
    provider: "Weaviate",
    description: "Open-source vector database with built-in ML models. Hybrid search combining BM25 and vectors.",
    endpoint: "https://{cluster}.weaviate.network/v1",
    costPer1k: 0.05,
    costUnit: "per month (1M objects)",
    tags: ["open-source", "hybrid-search", "bm25", "ml-models"],
  },
  {
    name: "qdrant-cloud",
    displayName: "Qdrant Cloud",
    category: "database" as const,
    provider: "Qdrant",
    description: "High-performance vector search engine. Payload filtering, sparse vectors, quantization support.",
    endpoint: "https://{cluster}.cloud.qdrant.io",
    costPer1k: 0.025,
    costUnit: "per month (1M vectors)",
    tags: ["high-performance", "filtering", "quantization"],
  },
  {
    name: "mongodb-atlas-vector",
    displayName: "MongoDB Atlas Vector Search",
    category: "database" as const,
    provider: "MongoDB",
    description: "Vector search integrated with MongoDB Atlas. Combine vector and full-text search in one query.",
    endpoint: "https://data.mongodb-api.com/app/data-{id}/endpoint/data/v1",
    costPer1k: 0.1,
    costUnit: "per month (1M vectors)",
    tags: ["mongodb", "hybrid-search", "full-text", "integrated"],
  },
  {
    name: "redis-vector-search",
    displayName: "Redis Vector Search",
    category: "database" as const,
    provider: "Redis",
    description: "In-memory vector search with sub-millisecond latency. HNSW and flat index support.",
    endpoint: "redis://{host}:6379",
    costPer1k: 0.03,
    costUnit: "per GB/month",
    tags: ["in-memory", "sub-ms", "hnsw", "fast"],
  },
  {
    name: "neon-serverless-postgres",
    displayName: "Neon Serverless Postgres",
    category: "database" as const,
    provider: "Neon",
    description: "Serverless PostgreSQL with branching. Scale to zero, instant provisioning, pgvector support.",
    endpoint: "postgresql://{user}:{pass}@{host}/neondb",
    costPer1k: 0.000048,
    costUnit: "per compute hour",
    tags: ["serverless", "branching", "scale-to-zero", "pgvector"],
  },
  // ─── COMMUNICATION ─────────────────────────────────────────────────────────
  {
    name: "resend-email",
    displayName: "Resend Email API",
    category: "communication" as const,
    provider: "Resend",
    description: "Developer-first email API. Send transactional emails with React templates. 100/day free.",
    endpoint: "https://api.resend.com/emails",
    costPer1k: 0.001,
    costUnit: "per email",
    tags: ["email", "transactional", "react-templates", "developer"],
  },
  {
    name: "sendgrid-email",
    displayName: "SendGrid Email",
    category: "communication" as const,
    provider: "Twilio SendGrid",
    description: "Enterprise email delivery. Marketing campaigns, transactional, analytics, and deliverability tools.",
    endpoint: "https://api.sendgrid.com/v3/mail/send",
    costPer1k: 0.00089,
    costUnit: "per email",
    tags: ["enterprise", "marketing", "analytics", "deliverability"],
  },
  {
    name: "twilio-sms",
    displayName: "Twilio SMS",
    category: "communication" as const,
    provider: "Twilio",
    description: "Programmable SMS and MMS. Global reach, delivery receipts, two-way messaging.",
    endpoint: "https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages",
    costPer1k: 0.0079,
    costUnit: "per SMS",
    tags: ["sms", "mms", "global", "two-way"],
  },
  {
    name: "slack-api",
    displayName: "Slack API",
    category: "communication" as const,
    provider: "Slack",
    description: "Send messages, create channels, manage workspaces. Webhooks and bot integration.",
    endpoint: "https://slack.com/api/chat.postMessage",
    costPer1k: 0,
    costUnit: "free with workspace",
    tags: ["messaging", "webhooks", "bots", "workspace"],
  },
  {
    name: "discord-api",
    displayName: "Discord API",
    category: "communication" as const,
    provider: "Discord",
    description: "Bot messaging, slash commands, webhooks. Real-time communication for communities.",
    endpoint: "https://discord.com/api/v10",
    costPer1k: 0,
    costUnit: "free",
    tags: ["bot", "webhooks", "slash-commands", "community"],
  },
  {
    name: "telegram-bot-api",
    displayName: "Telegram Bot API",
    category: "communication" as const,
    provider: "Telegram",
    description: "Full-featured bot API. Send messages, files, inline keyboards. 40M+ active bots.",
    endpoint: "https://api.telegram.org/bot{token}",
    costPer1k: 0,
    costUnit: "free",
    tags: ["bot", "files", "inline-keyboards", "free"],
  },
  {
    name: "manychat-api",
    displayName: "ManyChat API",
    category: "communication" as const,
    provider: "ManyChat",
    description: "Automate Instagram, Facebook Messenger, and WhatsApp conversations. Flow builder integration.",
    endpoint: "https://api.manychat.com/fb",
    costPer1k: 0.015,
    costUnit: "per subscriber",
    tags: ["instagram", "messenger", "whatsapp", "automation"],
  },
  {
    name: "whatsapp-cloud-api",
    displayName: "WhatsApp Cloud API",
    category: "communication" as const,
    provider: "Meta",
    description: "Official WhatsApp Business API. Send templates, interactive messages, and media.",
    endpoint: "https://graph.facebook.com/v18.0/{phone-id}/messages",
    costPer1k: 0.005,
    costUnit: "per conversation",
    tags: ["whatsapp", "business", "templates", "interactive"],
  },
  // ─── VECTOR ────────────────────────────────────────────────────────────────
  {
    name: "openai-embeddings-3-large",
    displayName: "OpenAI Embeddings text-embedding-3-large",
    category: "vector" as const,
    provider: "OpenAI",
    description: "3072-dimensional embeddings. Best quality for semantic search and RAG. Supports dimensionality reduction.",
    endpoint: "https://api.openai.com/v1/embeddings",
    costPer1k: 0.00013,
    costUnit: "per 1K tokens",
    tags: ["embeddings", "3072d", "semantic-search", "rag"],
  },
  {
    name: "openai-embeddings-3-small",
    displayName: "OpenAI Embeddings text-embedding-3-small",
    category: "vector" as const,
    provider: "OpenAI",
    description: "1536-dimensional embeddings. 5x cheaper than large. Excellent for most semantic search use cases.",
    endpoint: "https://api.openai.com/v1/embeddings",
    costPer1k: 0.00002,
    costUnit: "per 1K tokens",
    tags: ["embeddings", "1536d", "cheap", "semantic-search"],
  },
  {
    name: "cohere-embed-v3",
    displayName: "Cohere Embed v3",
    category: "vector" as const,
    provider: "Cohere",
    description: "Multilingual embeddings (100+ languages). Optimized for search and classification tasks.",
    endpoint: "https://api.cohere.ai/v1/embed",
    costPer1k: 0.0001,
    costUnit: "per 1K tokens",
    tags: ["multilingual", "100-languages", "search", "classification"],
  },
  {
    name: "voyage-ai-embeddings",
    displayName: "Voyage AI Embeddings",
    category: "vector" as const,
    provider: "Voyage AI",
    description: "Domain-specific embeddings for code, finance, law, and medical. State-of-the-art retrieval.",
    endpoint: "https://api.voyageai.com/v1/embeddings",
    costPer1k: 0.00012,
    costUnit: "per 1K tokens",
    tags: ["domain-specific", "code", "finance", "law", "medical"],
  },
  {
    name: "jina-embeddings-v3",
    displayName: "Jina Embeddings v3",
    category: "vector" as const,
    provider: "Jina AI",
    description: "8192 token context embeddings. Task-specific with LoRA adapters. Open-source available.",
    endpoint: "https://api.jina.ai/v1/embeddings",
    costPer1k: 0.000018,
    costUnit: "per 1K tokens",
    tags: ["8192-context", "lora", "open-source", "task-specific"],
  },
  // ─── UTILITY ───────────────────────────────────────────────────────────────
  {
    name: "browserbase-web-scraping",
    displayName: "Browserbase Web Scraping",
    category: "utility" as const,
    provider: "Browserbase",
    description: "Headless browser infrastructure for web scraping. Handles JS rendering, CAPTCHAs, and proxies.",
    endpoint: "https://api.browserbase.com/v1/sessions",
    costPer1k: 0.01,
    costUnit: "per session",
    tags: ["scraping", "headless", "captcha", "proxies"],
  },
  {
    name: "firecrawl-scraper",
    displayName: "Firecrawl Web Scraper",
    category: "utility" as const,
    provider: "Firecrawl",
    description: "Turn websites into LLM-ready markdown. Crawl entire sites, extract structured data, bypass blocks.",
    endpoint: "https://api.firecrawl.dev/v1/scrape",
    costPer1k: 0.003,
    costUnit: "per page",
    tags: ["markdown", "crawl", "structured-data", "llm-ready"],
  },
  {
    name: "apify-web-automation",
    displayName: "Apify Web Automation",
    category: "utility" as const,
    provider: "Apify",
    description: "1000+ pre-built scrapers and automation actors. LinkedIn, Amazon, Instagram data extraction.",
    endpoint: "https://api.apify.com/v2/acts",
    costPer1k: 0.004,
    costUnit: "per compute unit",
    tags: ["automation", "scrapers", "linkedin", "amazon"],
  },
  {
    name: "pdf-co-api",
    displayName: "PDF.co API",
    category: "utility" as const,
    provider: "PDF.co",
    description: "PDF processing: extract text, convert to/from PDF, merge, split, OCR, form filling.",
    endpoint: "https://api.pdf.co/v1",
    costPer1k: 0.01,
    costUnit: "per page",
    tags: ["pdf", "ocr", "extraction", "conversion"],
  },
  {
    name: "cloudflare-workers-ai",
    displayName: "Cloudflare Workers AI",
    category: "utility" as const,
    provider: "Cloudflare",
    description: "Run AI models at the edge. 50+ models including LLMs, image classification, and embeddings.",
    endpoint: "https://api.cloudflare.com/client/v4/accounts/{id}/ai/run",
    costPer1k: 0.00001,
    costUnit: "per neuron",
    tags: ["edge", "serverless", "50-models", "fast"],
  },
  {
    name: "n8n-workflow-api",
    displayName: "n8n Workflow Automation",
    category: "utility" as const,
    provider: "n8n",
    description: "Trigger and manage n8n workflows via API. Connect 400+ integrations with visual automation.",
    endpoint: "https://{instance}.n8n.cloud/api/v1/workflows",
    costPer1k: 0.001,
    costUnit: "per execution",
    tags: ["automation", "workflows", "400-integrations", "visual"],
  },
  {
    name: "zapier-nla",
    displayName: "Zapier NLA (AI Actions)",
    category: "utility" as const,
    provider: "Zapier",
    description: "Natural language interface to 5000+ Zapier apps. Let AI trigger any Zapier action.",
    endpoint: "https://nla.zapier.com/api/v1/dynamic/openai/action/list",
    costPer1k: 0.01,
    costUnit: "per action",
    tags: ["5000-apps", "natural-language", "automation"],
  },
  {
    name: "stripe-payments",
    displayName: "Stripe Payments API",
    category: "utility" as const,
    provider: "Stripe",
    description: "Accept payments, manage subscriptions, handle refunds. Global payment processing.",
    endpoint: "https://api.stripe.com/v1/payment_intents",
    costPer1k: 2.9,
    costUnit: "% + $0.30 per transaction",
    tags: ["payments", "subscriptions", "global", "refunds"],
  },
  {
    name: "github-api",
    displayName: "GitHub REST API",
    category: "utility" as const,
    provider: "GitHub",
    description: "Full GitHub automation: repos, PRs, issues, actions, deployments. 5000 req/hour.",
    endpoint: "https://api.github.com",
    costPer1k: 0,
    costUnit: "free (5000 req/hr)",
    tags: ["repos", "prs", "actions", "automation"],
  },
  {
    name: "vercel-deployments-api",
    displayName: "Vercel Deployments API",
    category: "utility" as const,
    provider: "Vercel",
    description: "Trigger deployments, manage projects, set env vars, configure domains programmatically.",
    endpoint: "https://api.vercel.com/v13/deployments",
    costPer1k: 0,
    costUnit: "free with Vercel account",
    tags: ["deployments", "env-vars", "domains", "automation"],
  },
  {
    name: "supabase-management-api",
    displayName: "Supabase Management API",
    category: "utility" as const,
    provider: "Supabase",
    description: "Manage Supabase projects, deploy Edge Functions, manage secrets, run SQL migrations.",
    endpoint: "https://api.supabase.com/v1",
    costPer1k: 0,
    costUnit: "free with Supabase account",
    tags: ["edge-functions", "secrets", "migrations", "management"],
  },
  {
    name: "digitalocean-api",
    displayName: "DigitalOcean API",
    category: "utility" as const,
    provider: "DigitalOcean",
    description: "Manage droplets, databases, Kubernetes clusters, and App Platform deployments.",
    endpoint: "https://api.digitalocean.com/v2",
    costPer1k: 0,
    costUnit: "free with DO account",
    tags: ["droplets", "kubernetes", "databases", "app-platform"],
  },
  {
    name: "langfuse-observability",
    displayName: "Langfuse LLM Observability",
    category: "utility" as const,
    provider: "Langfuse",
    description: "Open-source LLM observability. Trace LLM calls, evaluate outputs, monitor costs and latency.",
    endpoint: "https://cloud.langfuse.com/api",
    costPer1k: 0,
    costUnit: "free tier available",
    tags: ["observability", "tracing", "evaluation", "monitoring"],
  },
  {
    name: "litellm-gateway",
    displayName: "LiteLLM Gateway",
    category: "utility" as const,
    provider: "LiteLLM",
    description: "Unified API for 100+ LLM providers. Load balancing, fallbacks, cost tracking, caching.",
    endpoint: "https://{host}/v1/chat/completions",
    costPer1k: 0,
    costUnit: "self-hosted",
    tags: ["gateway", "100-providers", "load-balancing", "caching"],
  },
  {
    name: "flowise-ai-builder",
    displayName: "Flowise Visual AI Builder",
    category: "utility" as const,
    provider: "Flowise",
    description: "Build LLM apps visually. Drag-and-drop chains, agents, and RAG pipelines. REST API export.",
    endpoint: "https://{host}/api/v1/prediction",
    costPer1k: 0,
    costUnit: "self-hosted",
    tags: ["visual-builder", "chains", "agents", "rag"],
  },
];

export const EDGE_FUNCTION_TEMPLATES_DATA = [
  {
    slug: "llm-router",
    name: "LLM Router",
    description: "Intelligently routes LLM requests to the optimal model based on task type, cost constraints, and latency requirements. Supports fallback chains.",
    category: "llm",
    envVarsRequired: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "DEEPSEEK_API_KEY"],
    code: `// LLM Router Edge Function
// Routes to optimal model based on task complexity and cost
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MODELS = {
  fast: { provider: "openai", model: "gpt-4o-mini", costPer1k: 0.00015 },
  balanced: { provider: "deepseek", model: "deepseek-v3", costPer1k: 0.00028 },
  powerful: { provider: "anthropic", model: "claude-3-5-sonnet-20241022", costPer1k: 0.015 },
  reasoning: { provider: "deepseek", model: "deepseek-r1", costPer1k: 0.00055 },
}

serve(async (req) => {
  const { prompt, mode = "balanced", maxTokens = 2048 } = await req.json()
  
  const model = MODELS[mode] || MODELS.balanced
  
  let response
  if (model.provider === "openai") {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": \`Bearer \${Deno.env.get("OPENAI_API_KEY")}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens })
    })
  } else if (model.provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.model, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] })
    })
  } else {
    response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": \`Bearer \${Deno.env.get("DEEPSEEK_API_KEY")}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens })
    })
  }
  
  const data = await response.json()
  return new Response(JSON.stringify({ result: data, model: model.model, estimatedCost: (maxTokens / 1000) * model.costPer1k }), {
    headers: { "Content-Type": "application/json" }
  })
})`,
  },
  {
    slug: "image-router",
    name: "Image Router",
    description: "Routes image generation requests to the optimal provider based on style requirements, quality needs, and budget. Supports DALL-E 3, Flux Pro, and Stability AI.",
    category: "image",
    envVarsRequired: ["OPENAI_API_KEY", "REPLICATE_API_TOKEN", "STABILITY_API_KEY"],
    code: `// Image Router Edge Function
// Routes to optimal image generation model
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { prompt, style = "photorealistic", quality = "standard", size = "1024x1024" } = await req.json()
  
  let imageUrl, provider, cost
  
  if (style === "artistic" || style === "creative") {
    // Use Flux Pro for artistic styles
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-pro/predictions", {
      method: "POST",
      headers: { "Authorization": \`Token \${Deno.env.get("REPLICATE_API_TOKEN")}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: { prompt, width: 1024, height: 1024 } })
    })
    const prediction = await response.json()
    // Poll for result
    let result = prediction
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise(r => setTimeout(r, 1000))
      const poll = await fetch(prediction.urls.get, { headers: { "Authorization": \`Token \${Deno.env.get("REPLICATE_API_TOKEN")}\` } })
      result = await poll.json()
    }
    imageUrl = result.output?.[0]
    provider = "flux-pro"
    cost = 0.055
  } else {
    // Use DALL-E 3 for photorealistic
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": \`Bearer \${Deno.env.get("OPENAI_API_KEY")}\`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size, quality: quality === "hd" ? "hd" : "standard" })
    })
    const data = await response.json()
    imageUrl = data.data?.[0]?.url
    provider = "dall-e-3"
    cost = quality === "hd" ? 0.08 : 0.04
  }
  
  return new Response(JSON.stringify({ imageUrl, provider, cost, prompt }), {
    headers: { "Content-Type": "application/json" }
  })
})`,
  },
  {
    slug: "parallel-search",
    name: "Parallel Search",
    description: "Executes searches across multiple providers simultaneously (Perplexity, Tavily, Brave) and merges results with deduplication and relevance ranking.",
    category: "search",
    envVarsRequired: ["PERPLEXITY_API_KEY", "TAVILY_API_KEY", "BRAVE_API_KEY"],
    code: `// Parallel Search Edge Function
// Searches multiple providers simultaneously and merges results
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { query, providers = ["perplexity", "tavily", "brave"], maxResults = 5 } = await req.json()
  
  const searches = []
  
  if (providers.includes("perplexity")) {
    searches.push(
      fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { "Authorization": \`Bearer \${Deno.env.get("PERPLEXITY_API_KEY")}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: query }], max_tokens: 1024 })
      }).then(r => r.json()).then(d => ({ provider: "perplexity", content: d.choices?.[0]?.message?.content, citations: d.citations || [] }))
    )
  }
  
  if (providers.includes("tavily")) {
    searches.push(
      fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: Deno.env.get("TAVILY_API_KEY"), query, max_results: maxResults })
      }).then(r => r.json()).then(d => ({ provider: "tavily", results: d.results || [], answer: d.answer }))
    )
  }
  
  if (providers.includes("brave")) {
    searches.push(
      fetch(\`https://api.search.brave.com/res/v1/web/search?q=\${encodeURIComponent(query)}&count=\${maxResults}\`, {
        headers: { "Accept": "application/json", "X-Subscription-Token": Deno.env.get("BRAVE_API_KEY") }
      }).then(r => r.json()).then(d => ({ provider: "brave", results: d.web?.results || [] }))
    )
  }
  
  const results = await Promise.allSettled(searches)
  const merged = results.filter(r => r.status === "fulfilled").map(r => r.value)
  
  return new Response(JSON.stringify({ query, results: merged, totalProviders: merged.length }), {
    headers: { "Content-Type": "application/json" }
  })
})`,
  },
  {
    slug: "vector-search",
    name: "Vector Search",
    description: "Semantic search using pgvector. Generates OpenAI embeddings for the query and finds the most similar functions in the registry using cosine similarity.",
    category: "vector",
    envVarsRequired: ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"],
    code: `// Vector Search Edge Function
// Semantic search using pgvector + OpenAI embeddings
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { query, matchCount = 5, threshold = 0.7 } = await req.json()
  
  // Generate embedding for the query
  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": \`Bearer \${Deno.env.get("OPENAI_API_KEY")}\`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: query })
  })
  const { data: [{ embedding }] } = await embeddingResponse.json()
  
  // Search pgvector
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_KEY")
  )
  
  const { data: matches, error } = await supabase.rpc("match_functions", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: matchCount
  })
  
  if (error) throw error
  
  return new Response(JSON.stringify({ query, matches, embeddingDimensions: embedding.length }), {
    headers: { "Content-Type": "application/json" }
  })
})`,
  },
  {
    slug: "kimi-auto-deploy",
    name: "KIMI Auto-Deploy",
    description: "KIMI K2.5 autonomously writes Edge Function code based on a natural language description and deploys it to Supabase via the Management API.",
    category: "utility",
    envVarsRequired: ["KIMI_API_KEY", "SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF"],
    code: `// KIMI Auto-Deploy Edge Function
// KIMI K2.5 writes and deploys Edge Functions autonomously
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const KIMI_SYSTEM_PROMPT = \`You are KIMI K2.5, an expert at writing Supabase Edge Functions in TypeScript/Deno.
Write production-ready Edge Functions that:
- Use Deno.env.get() for secrets
- Handle CORS properly
- Include error handling
- Return JSON responses
- Are efficient and minimal
Output ONLY the complete Edge Function code, no explanations.\`

serve(async (req) => {
  const { description, functionName, envVars = [] } = await req.json()
  
  // Step 1: KIMI generates the Edge Function code
  const kimiResponse = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": \`Bearer \${Deno.env.get("KIMI_API_KEY")}\`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "moonshot-v1-128k",
      messages: [
        { role: "system", content: KIMI_SYSTEM_PROMPT },
        { role: "user", content: \`Write an Edge Function for: \${description}\\nRequired env vars: \${envVars.join(", ")}\` }
      ],
      max_tokens: 4096
    })
  })
  const kimiData = await kimiResponse.json()
  const generatedCode = kimiData.choices?.[0]?.message?.content
  
  // Step 2: Deploy to Supabase Management API
  const deployResponse = await fetch(
    \`https://api.supabase.com/v1/projects/\${Deno.env.get("SUPABASE_PROJECT_REF")}/functions\`,
    {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${Deno.env.get("SUPABASE_ACCESS_TOKEN")}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slug: functionName,
        name: functionName,
        body: generatedCode,
        verify_jwt: false
      })
    }
  )
  const deployData = await deployResponse.json()
  
  return new Response(JSON.stringify({
    success: deployResponse.ok,
    functionName,
    deployedAt: new Date().toISOString(),
    supabaseResponse: deployData,
    codePreview: generatedCode?.substring(0, 500) + "..."
  }), { headers: { "Content-Type": "application/json" } })
})`,
  },
];
