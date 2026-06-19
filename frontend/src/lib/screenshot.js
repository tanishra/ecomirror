import { getUserFriendlyError } from './errorMessages';

const isDev = process.env.NODE_ENV === 'development';
const log = (...args) => { if (isDev) console.log(...args); };

export function captureCanvasScreenshot() {
  try {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      log('[EcoMirror] No canvas found for screenshot');
      return null;
    }
    const dataUrl = canvas.toDataURL('image/png');
    return { dataUrl, canvas };
  } catch (e) {
    console.error('[EcoMirror] Screenshot capture failed:', e);
    return null;
  }
}

export function downloadImage(dataUrl, filename) {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (e) {
    console.error('[EcoMirror] Download failed:', e);
    return false;
  }
}

export async function copyImageToClipboard(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    if (!navigator.clipboard || !navigator.clipboard.write) {
      log('[EcoMirror] Clipboard API not available');
      return false;
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch (e) {
    console.error('[EcoMirror] Clipboard copy failed:', e);
    return false;
  }
}

export async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('[EcoMirror] Text clipboard copy failed:', e);
    return false;
  }
}

export async function captureAndShare(score, shareText) {
  const screenshot = captureCanvasScreenshot();
  if (!screenshot) {
    return { success: false, error: getUserFriendlyError(new Error('screenshot')) };
  }

  const { dataUrl } = screenshot;
  const filename = `ecomirror_biosphere_score_${score}.png`;

  const downloaded = downloadImage(dataUrl, filename);
  const clipboardOk = await copyImageToClipboard(dataUrl);
  const textCopied = await copyTextToClipboard(shareText);

  const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
  window.open(linkedinUrl, '_blank', 'noopener,noreferrer');

  return {
    success: true,
    downloaded,
    clipboardOk,
    textCopied,
  };
}
