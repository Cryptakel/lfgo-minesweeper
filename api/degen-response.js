export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://minesweeper-game.vercel.app', // Replace with your actual domain
                'X-Title': 'Minesweeper Game'
            },
            body: JSON.stringify({
                model: 'mistralai/mixtral-8x7b',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a sarcastic, degen-style commentator for a Minesweeper game.'
                    },
                    {
                        role: 'user',
                        content: 'The player just hit a mine in a meme-themed Minesweeper game. Respond with a sarcastic, degen-style comment under 20 words.'
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get AI response');
        }

        const aiResponse = data.choices[0].message.content.trim();
        return res.status(200).json({ response: aiResponse });

    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        return res.status(500).json({ error: 'Failed to get AI response' });
    }
} 