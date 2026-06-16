export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { text } = req.body;

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Texto muito curto' });
  }

  // A chave fica aqui no servidor — o usuário nunca a vê
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada' });
  }

  const prompt = `Você é um especialista em SEO e GEO (Generative Engine Optimization) para portais de jornalismo. Analise o texto abaixo e retorne APENAS um objeto JSON válido, sem markdown, sem explicações, sem texto antes ou depois.

O JSON deve ter exatamente estas chaves:
- "titulo": título SEO com até 60 caracteres, claro e direto
- "resumo": resumo editorial de 2-3 linhas capturando o lead
- "metadescricao": metadescrição de até 155 caracteres para SERP
- "palavras_chave": string com 5-8 palavras-chave separadas por vírgula
- "tags": string com 4-6 tags editoriais curtas separadas por vírgula
- "pergunta_geo": 2-3 perguntas naturais que uma IA responderia usando este conteúdo, separadas por " | "
- "schema_sugerido": tipo de Schema.org recomendado (ex: NewsArticle, Article, FAQPage) com breve justificativa

Texto:
${text.substring(0, 3000)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Erro ao chamar a API:', err);
    return res.status(500).json({ error: 'Falha ao gerar metadados. Tente novamente.' });
  }
}
