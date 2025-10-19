// api/generate-will.js
// Vercel serverless function using native fetch (Node 18+).
// Expects environment variable: CEREBRAS_AI_API_KEY

export default async function handler(req, res) {
  // CORS headers (useful for local dev and if your frontend is served from a different origin)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).send("");
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const API_KEY = process.env.CEREBRAS_AI_API_KEY;
  if (!API_KEY) {
    console.error("Missing CEREBRAS_AI_API_KEY environment variable.");
    return res
      .status(500)
      .json({ error: "Server not configured. Missing CEREBRAS_AI_API_KEY." });
  }

  // Expect JSON body with the form fields
  const payload = req.body || {};
  const {
    fullName = "",
    website = "",
    playlist = "",
    workApp = "",
    bestFriend = "",
    socialPlatform = "",
    socialHandle = "",
    trend = "",
    signature = "",
  } = payload;

  // Basic validation
  const missing = [];
  if (!fullName) missing.push("fullName");
  if (!website) missing.push("website");
  if (!playlist) missing.push("playlist");
  if (!workApp) missing.push("workApp");
  if (!bestFriend) missing.push("bestFriend");
  if (!socialPlatform) missing.push("socialPlatform");
  if (!socialHandle) missing.push("socialHandle");
  if (!trend) missing.push("trend");
  if (!signature) missing.push("signature");

  if (missing.length) {
    return res.status(400).json({ error: "Missing required fields", missing });
  }

  // Construct prompt — instruct the model to return only HTML-formatted will
  const modelName = "qwen-3-235b-a22b-instruct-2507"; // Cerebras model you specified
  const apiUrl = "https://api.cerebras.ai/v1/chat/completions";

  // Provide example output and clear instruction to return HTML only
  const prompt = `
Act as a witty, dramatic, and funny notary public for the end of the internet.
Write a "Last Will and Digital Testament" using the user's data. The will must:
- Use HTML tags <h3>, <h4>, <p> and <strong>/<em> as shown in the example.
- Be humorous, official-sounding, and use the user's inputs in-context (do not just list them).
- Return ONLY the HTML-formatted will (no additional commentary or explanation).

User's Information:
- Full Name: ${fullName}
- Their most visited website: ${website}
- Their favorite playlist: ${playlist}
- Their least favorite work app: ${workApp}
- Their best friend's name: ${bestFriend}
- Their favorite social media platform: ${socialPlatform}
- Their handle on that platform: ${socialHandle}
- The internet trend they hate: ${trend}
- Their email signature: ${signature}

EXAMPLE OUTPUT:
<h3>Last Will and Digital Testament</h3>
<p>I, <strong>${fullName}</strong>, being of questionable sanity and over-caffeinated mind, do hereby declare this document to be my final decree regarding my digital estate as the internet collapses around us.</p>
<h4>Article I: The Digital Assets</h4>
<p>To my best friend, <strong>${bestFriend}</strong>, I bequeath my most visited website, <strong>${website}</strong>. May its endless scroll bring you the same comfort it brought me during countless unproductive hours. I also grant you lifetime access to my favorite playlist, "<strong>${playlist}</strong>," for all your dramatic entrances.</p>
<h4>Article II: The Burdens</h4>
<p>My eternal nemesis, the app known as <strong>${workApp}</strong>, shall be digitally exorcised from all devices. May its notifications haunt the void of cyberspace forever. Furthermore, the internet trend of <strong>'${trend}'</strong> is to be scrubbed from the memory of mankind.</p>
<h4>Article III: The Legacy</h4>
<p>My beloved ${socialPlatform} handle, <strong>${socialHandle}</strong>, shall be memorialized. A single, final post should read: "It was a weird ride. Peace out." My digital signature shall henceforth be retired:</p>
<p><em>${signature.replace(/\n/g, "<br>")}</em></p>
<p>Signed and sealed on this, the last day of the internet.</p>
<br>
<p>_________________________</p>
<p><strong>${fullName}</strong></p>
  `;

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        max_completion_tokens: 20000,
        top_p: 0.8,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Cerebras API error", resp.status, text);
      // Return the raw error text for easier debugging (avoid leaking secrets)
      return res
        .status(resp.status)
        .json({ error: "Cerebras API request failed", detail: text });
    }

    const data = await resp.json();

    // Try to extract generated will content — adapt if Cerebras returns a different shape
    const aiGeneratedWill =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.output?.[0]?.content ??
      null;

    if (!aiGeneratedWill) {
      console.error("Unexpected Cerebras response shape", JSON.stringify(data));
      return res
        .status(502)
        .json({ error: "Unexpected response from Cerebras AI", raw: data });
    }

    // Return the HTML as JSON (frontend will insert it into the page safely)
    return res.status(200).json({ will: aiGeneratedWill });
  } catch (err) {
    console.error("Function error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", detail: String(err) });
  }
}
