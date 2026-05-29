/**
 * KEDA - PDF Metin Çıkarma
 * pdf.js ile tarayıcıda client-side PDF işleme
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  // pdf.js'i dinamik olarak yükle (SSR sorunu olmaz)
  const pdfjsLib = await import("pdfjs-dist");
  
  // Worker'ı CDN'den yükle (bundle size sorununu önler)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

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
