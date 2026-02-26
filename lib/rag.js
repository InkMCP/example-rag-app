const OpenAI = require('openai');
const { insertDocument, insertChunk, insertVecChunk, searchSimilar } = require('./db');
const { embed, embedBatch } = require('./embeddings');
const { chunkText } = require('./chunker');

const openai = new OpenAI();

const CHAT_MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 100;

async function ingest(filename, text) {
  const docId = insertDocument(filename, text);
  const chunks = chunkText(text);

  // Embed and store in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch);

    for (let j = 0; j < batch.length; j++) {
      const chunkId = insertChunk(docId, batch[j], i + j);
      insertVecChunk(chunkId, embeddings[j]);
    }
  }

  return { documentId: docId, chunks: chunks.length };
}

async function search(query, topK = 5) {
  const queryEmbedding = await embed(query);
  return searchSimilar(queryEmbedding, topK);
}

async function generate(question) {
  const results = await search(question);

  if (results.length === 0) {
    return {
      answer: 'No documents have been uploaded yet. Please upload a document first.',
      sources: []
    };
  }

  const context = results
    .map((r, i) => `[${i + 1}] (${r.filename}):\n${r.chunk_text}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that answers questions based on the provided context.
Use only the context below to answer. If the context doesn't contain enough information, say so.
Cite your sources using [1], [2], etc.

Context:
${context}`
      },
      {
        role: 'user',
        content: question
      }
    ],
    temperature: 0.2
  });

  const sources = results.map(r => ({
    filename: r.filename,
    text: r.chunk_text.slice(0, 200) + (r.chunk_text.length > 200 ? '...' : ''),
    distance: r.distance
  }));

  return {
    answer: response.choices[0].message.content,
    sources
  };
}

module.exports = { ingest, search, generate };
