/**
 * KEDA - PDF Metin Çıkarma
 * pdfjs CDN'den script olarak yüklenir — Next.js bundle etmez
 */

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// CDN'den script yükle (bir kez)
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script yüklenemedi: ${src}`));
    document.head.appendChild(script);
  });
}

export async function extractTextFromPDF(file: File): Promise<string> {
  // pdf.js CDN'den yükle
  await loadScript(`${PDFJS_CDN}/pdf.min.js`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("pdf.js yüklenemedi");

  pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str?: string }) => item.str || "")
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}
