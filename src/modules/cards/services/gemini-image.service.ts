import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiImageService {
  async generateImage(prompt: string): Promise<string> {
    const enabled = process.env.CARD_IMAGE_PROVIDER_ENABLED === 'true';
    if (!enabled) throw new Error('CARD_IMAGE_PROVIDER_ENABLED is false');

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    const apiBase =
      process.env.GEMINI_API_BASE ||
      'https://generativelanguage.googleapis.com/v1beta';

    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

    const url = `${apiBase.replace(/\/+$/, '')}/models/${model}:generateContent`;
    const retryDelaysMs = [5000, 12000, 25000];
    let res: Response | null = null;
    let lastErrorBody = '';

    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
      });
      console.log(res);
      

      if (res.ok) break;

      lastErrorBody = await res.text();
      if (res.status !== 429 || attempt === retryDelaysMs.length) {
        throw new Error(
          `Gemini image generation failed: ${res.status} ${lastErrorBody}`,
        );
      }

      const retryAfterSec = Number(res.headers.get('retry-after') || '0');
      const fallbackDelay = retryDelaysMs[attempt];
      const delayMs =
        Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? retryAfterSec * 1000
          : fallbackDelay;
      await this.sleep(delayMs);
    }

    if (!res || !res.ok) {
      throw new Error(
        `Gemini image generation failed after retries: ${
          lastErrorBody || 'unknown error'
        }`,
      );
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
        };
      }>;
    };
    const parts = json.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    const b64 = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType || 'image/png';
    if (!b64) throw new Error('Gemini response did not include inline image data');

    return `data:${mimeType};base64,${b64}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
