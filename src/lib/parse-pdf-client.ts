import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  return pages.join("\n\n");
}
