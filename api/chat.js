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

    // Convert messages to Gemini format
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini error:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || 'Désolé, je ne peux pas répondre pour le moment.';

    // Return in same format expected by frontend
    res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer.' });
  }
}
