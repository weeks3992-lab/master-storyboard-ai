
export async function GET() {
  return Response.json({
    message: "FrameForge AI storyboard API is ready.",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY belum diatur di Vercel." },
        { status: 500 }
      );
    }

    const model =
      process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return Response.json(
        { error: "Prompt storyboard tidak boleh kosong." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Create a concise storyboard from this idea. " +
                    "Describe scenes in order, including visual action, " +
                    "camera framing, and mood. Story idea: " +
                    prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "AI request failed." },
        { status: response.status }
      );
    }

    const storyboard =
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("\n") || "No storyboard was returned.";

    return Response.json({ storyboard });
  } catch {
    return Response.json(
      { error: "Permintaan tidak valid atau terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

