export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { messages, system } = req.body;

    const systemPrompt = system || `Tu es l'assistant officiel du portail e-gouvernement d'Haïti (DINIH). 
Tu réponds aux questions sur les démarches administratives haïtiennes : état civil (ONI), 
passeport (AGD/DGM), impôts/NIF (DGI), ONA (assurance vieillesse), MENFP (éducation), 
MSPP (santé), DCSR (transport), MCCE (commerce), MAST (affaires sociales), justice (MJ). 
Tu parles la langue de l'utilisateur : français, créole haïtien ou anglais. 
Tu es précis, bienveillant, concis. Réponds en 2-5 phrases max sauf si plus de détail est demandé.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq error:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content
      || 'Désolé, je ne peux pas répondre pour le moment.';

    res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer.' });
  }
}
