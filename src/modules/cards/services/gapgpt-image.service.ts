import { Injectable } from '@nestjs/common';

@Injectable()
export class GapgptImageService {
  async generateImage(prompt: string): Promise<string> {
    const enabled = process.env.CARD_IMAGE_PROVIDER_ENABLED === 'true';
    if (!enabled) {
      throw new Error('CARD_IMAGE_PROVIDER_ENABLED is false');
    }

    const apiKey = process.env.GAPGPT_API_KEY;
    const baseUrl = process.env.GAPGPT_BASE_URL;
    const model = process.env.GAPGPT_IMAGE_MODEL || 'gpt-image-2';

    if (!apiKey) throw new Error('GAPGPT_API_KEY is missing');
    if (!baseUrl) throw new Error('GAPGPT_BASE_URL is missing');
    
    const res = await fetch(
      `${baseUrl.replace(/\/+$/, '')}/images/generations`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          size: process.env.GAPGPT_IMAGE_SIZE || '1024x1024',
        }),
      },
    );

    console.log(res);
    

    if (!res.ok) {
      throw new Error(
        `GapGPT image generation failed: ${res.status} ${await res.text()}`,
      );
    }

    const json = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const first = json.data?.[0];
    if (first?.url) return first.url;
    if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
    throw new Error('GapGPT response did not include image url or b64_json');
  }
}
