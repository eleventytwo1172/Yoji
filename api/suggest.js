export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY; // safe server-side

  const payload = req.body;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  res.status(200).json(data);
}
