const SEPARATORS = ['\n\n', '\n', '. ', ' '];

function chunkText(text, { chunkSize = 1000, chunkOverlap = 200 } = {}) {
  const chunks = [];
  splitRecursive(text, SEPARATORS, chunkSize, chunkOverlap, chunks);
  return chunks;
}

function splitRecursive(text, separators, chunkSize, chunkOverlap, chunks) {
  if (text.length <= chunkSize) {
    if (text.trim()) chunks.push(text.trim());
    return;
  }

  const separator = separators.find(sep => text.includes(sep)) || '';
  const parts = separator ? text.split(separator) : [text];

  let current = '';

  for (const part of parts) {
    const piece = current ? current + separator + part : part;

    if (piece.length > chunkSize && current) {
      chunks.push(current.trim());
      // Overlap: keep the tail of the current chunk
      const overlapStart = Math.max(0, current.length - chunkOverlap);
      current = current.slice(overlapStart) + separator + part;
    } else if (piece.length > chunkSize) {
      // Single part is too large — try next separator
      const remaining = separators.slice(separators.indexOf(separator) + 1);
      if (remaining.length > 0) {
        splitRecursive(part, remaining, chunkSize, chunkOverlap, chunks);
        current = '';
      } else {
        // Last resort: hard split
        for (let i = 0; i < part.length; i += chunkSize - chunkOverlap) {
          const slice = part.slice(i, i + chunkSize).trim();
          if (slice) chunks.push(slice);
        }
        current = '';
      }
    } else {
      current = piece;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }
}

module.exports = { chunkText };
