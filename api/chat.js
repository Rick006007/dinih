export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { messages, system } = req.body;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: system || `Tu es l'assistant officiel du portail e-gouvernement d'Haïti (DINIH). 
Tu réponds aux questions sur les démarches administratives haïtiennes : état civil (ONI), 
passeport (AGD/DGM), impôts/NIF (DGI), ONA (assurance vieillesse), MENFP (éducation), 
MSPP (santé), DCSR (transport), MCCE (commerce), MAST (affaires sociales), justice (MJ). 
Tu parles la langue de l'utilisateur : français, créole haïtien ou anglais. 
Tu es précis, bienveillant, concis. Réponds en 2-5 phrases max sauf si plus de détail est demandé.`
          },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();

    // Return in same format as Anthropic for easy swap
    res.status(200).json({
      content: [
        {
          type: 'text',
          text: data.choices?.[0]?.message?.content || 'Désolé, je ne peux pas répondre pour le moment.'
        }
      ]
    });

  } catch (error) {
    console.error('DeepSeek API error:', error);
    res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer.' });
  }
}
