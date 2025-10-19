// api/generate-will.js
import fetch from "node-fetch"; // Use import for ESM

export default async function (req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const CEREBRAS_AI_API_KEY = process.env.CEREBRAS_AI_API_KEY;
  const CEREBRAS_API_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";
  const CEREBRAS_MODEL_NAME = "qwen-3-235b-a22b-instruct-2507";

  if (!CEREBRAS_AI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Cerebras AI API Key not configured." });
  }

  try {
    const formData = req.body; // Vercel automatically parses JSON bodies for you

    const prompt = `
            Act as a witty, dramatic, and funny notary public for the end of the internet.
            Your task is to write a "Last Will and Digital Testament" for a user.
            The will should be structured with a title, a preamble, and a few "articles."
            You MUST use all the information provided by the user below, weaving it into the will in a humorous and creative way.
            Do NOT just list the information. Make it sound official but absurd.
            End with a closing statement and a line for the user's name.

            User's Information:
            - Full Name: ${formData.fullName}
            - Their most visited website: ${formData.website}
            - Their favorite playlist: ${formData.playlist}
            - Their least favorite work app: ${formData.workApp}
            - Their best friend's name: ${formData.bestFriend}
            - Their favorite social media platform: ${formData.socialPlatform}
            - Their handle on that platform: ${formData.socialHandle}
            - The internet trend they hate: ${formData.trend}
            - Their email signature: "${formData.signature}"

            Generate ONLY the HTML-formatted text of the will, using <p> and <h4> tags. Do not include any other commentary.
            The output should follow this structure and style:

            EXAMPLE OUTPUT:
            <h3>Last Will and Digital Testament</h3>
            <p>I, <strong>[User's Full Name]</strong>, being of questionable sanity and over-caffeinated mind, do hereby declare this document to be my final decree regarding my digital estate as the internet collapses around us.</p>
            <h4>Article I: The Digital Assets</h4>
            <p>To my best friend, <strong>[Best Friend's Name]</strong>, I bequeath my most visited website, <strong>[Most Visited Website]</strong>. May its endless scroll bring you the same comfort it brought me during countless unproductive hours. I also grant you lifetime access to my favorite playlist, "<strong>[Favorite Playlist]</strong>," for all your dramatic entrances.</p>
            <h4>Article II: The Burdens</h4>
            <p>My eternal nemesis, the app known as <strong>[Least Favorite Work App]</strong>, shall be digitally exorcised from all devices. May its notifications haunt the void of cyberspace forever. Furthermore, the internet trend of <strong>'[Least Favorite Internet Trend]'</strong> is to be scrubbed from the memory of mankind.</p>
            <h4>Article III: The Legacy</h4>
            <p>My beloved [Favorite Social Media Platform] handle, <strong>[Social Media Handle]</strong>, shall be memorialized. A single, final post should read: "It was a weird ride. Peace out." My digital signature shall henceforth be retired:</p>
            <p><em>[Email Signature with line breaks as &lt;br&gt; tags]</em></p>
            <p>Signed and sealed on this, the last day of the internet.</p>
            <br>
            <p>_________________________</p>
            <p><strong>[User's Full Name]</strong></p>
        `;

    const response = await fetch(CEREBRAS_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        max_completion_tokens: 20000,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cerebras AI API Error:", errorData);
      return res
        .status(response.status)
        .json({
          error: `Cerebras AI API Error: ${errorData.detail || response.statusText}`,
        });
    }

    const data = await response.json();
    const aiGeneratedWill = data.choices[0].message.content;

    return res.status(200).json({ will: aiGeneratedWill });
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
