const OpenAI = require('openai');

const openai = new OpenAI();

const EMBEDDING_MODEL = 'text-embedding-3-small';

async function embed(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  });
  return response.data[0].embedding;
}

async function embedBatch(texts) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts
  });
  return response.data.map(d => d.embedding);
}

module.exports = { embed, embedBatch };
