// Web Worker: in-browser image captioning via Transformers.js.
// Runs off the main thread so the UI stays responsive while the ~200MB model
// downloads (first use only; cached by the browser afterward) and runs.

import { pipeline, env } from '@xenova/transformers'

// Fetch models from the Hugging Face CDN; we don't ship local model files.
env.allowLocalModels = false

let captioner = null
const MODEL_ID = 'Xenova/vit-gpt2-image-captioning'

self.addEventListener('message', async (event) => {
  const { image } = event.data
  try {
    if (!captioner) {
      captioner = await pipeline('image-to-text', MODEL_ID, {
        // Reports both model-download progress and load status
        progress_callback: (p) => self.postMessage({ status: 'progress', data: p }),
      })
    }

    self.postMessage({ status: 'analyzing' })
    const output = await captioner(image)
    const caption = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text
    self.postMessage({ status: 'complete', caption: (caption || '').trim() })
  } catch (err) {
    self.postMessage({ status: 'error', error: err?.message || 'Captioning failed' })
  }
})
