# RAG Application

A retrieval-augmented generation app that lets you upload documents and ask questions about them. Uses SQLite as a vector database, OpenAI for embeddings and chat completions, and a React frontend.

## How It Works

1. **Upload** a document (`.txt`, `.md`, or `.pdf`)
2. The app **chunks** the text and generates **embeddings** via OpenAI
3. Chunks and embeddings are stored in **SQLite** using the `sqlite-vec` extension
4. **Ask a question** — the app finds relevant chunks via vector similarity search, then generates an answer with GPT-4o-mini

## Tech Stack

- **Server**: Node.js + Express
- **Vector DB**: SQLite via `better-sqlite3` + `sqlite-vec`
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **LLM**: OpenAI `gpt-4o-mini`
- **Frontend**: React 18 (CDN, no build step)

## Setup

```bash
git clone https://github.com/InkMCPDev/example-rag-app.git
cd example-rag-app
npm install
```

Create a `.env` file with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

Start the server:

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy with Ink

Connect the [Ink MCP server](https://docs.deployink.com/quick-start) to your AI agent and prompt:

> Deploy the example-rag-app repo from github. Set the OPENAI_API_KEY environment variable.

## Tutorial

Full step-by-step tutorial: [docs.deployink.com/examples/ai-and-mcp/rag-app](https://docs.deployink.com/examples/ai-and-mcp/rag-app)

## About Ink

[Ink](https://deployink.com) is a deployment platform built for AI agents. Connect the Ink MCP server to any AI coding agent and deploy applications, manage domains, databases, and infrastructure — all through natural language.

- **Website**: [deployink.com](https://deployink.com)
- **Documentation**: [docs.deployink.com](https://docs.deployink.com)
- **Quick Start**: [docs.deployink.com/quick-start](https://docs.deployink.com/quick-start)
- **Examples**: [docs.deployink.com/examples](https://docs.deployink.com/examples)
