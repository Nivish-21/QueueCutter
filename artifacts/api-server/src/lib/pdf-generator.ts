import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { FormSchema } from "./forms.js";

export interface MappedField {
  fieldName: string;
  officialLabel: string;
  value: string;
  isEmpty: boolean;
}

export async function generatePdf(
  form: FormSchema,
  mappedFields: MappedField[],
  _answers: Record<string, string>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN = 50;
  const COL_WIDTH = PAGE_WIDTH - MARGIN * 2;

  const navyBlue = rgb(0.118, 0.227, 0.373);
  const lightBlue = rgb(0.627, 0.769, 0.91);
  const white = rgb(1, 1, 1);
  const darkGray = rgb(0.13, 0.13, 0.13);
  const midGray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.97, 0.97, 0.97);
  const fieldBorder = rgb(0.867, 0.886, 0.902);
  const warningAmber = rgb(0.996, 0.949, 0.804);
  const warningBorder = rgb(1, 0.773, 0.027);
  const warningText = rgb(0.522, 0.392, 0.016);
  const errorRed = rgb(0.753, 0.224, 0.169);
  const errorBg = rgb(1, 0.961, 0.961);

  function addPage() {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page, yPos: PAGE_HEIGHT - MARGIN };
  }

  function drawHeaderBar(page: ReturnType<typeof pdfDoc.addPage>) {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 70, width: PAGE_WIDTH, height: 70, color: navyBlue });
    page.drawText("QueueCutter", { x: MARGIN, y: PAGE_HEIGHT - 35, size: 18, font: helveticaBold, color: white });
    page.drawText("AI Paperwork Copilot — Prepared Form (Not an official document)", {
      x: MARGIN, y: PAGE_HEIGHT - 54, size: 8, font: helvetica, color: lightBlue,
    });
  }

  let currentPage = addPage();
  drawHeaderBar(currentPage.page);
  let y = currentPage.page.getHeight() - 90;

  function ensureSpace(needed: number): void {
    if (y - needed < MARGIN) {
      currentPage = addPage();
      drawHeaderBar(currentPage.page);
      y = PAGE_HEIGHT - 90;
    }
  }

  function drawText(text: string, opts: {
    x?: number; size?: number; font?: typeof helvetica; color?: ReturnType<typeof rgb>; maxWidth?: number;
  } = {}) {
    const { x = MARGIN, size = 10, font = helvetica, color = darkGray, maxWidth = COL_WIDTH } = opts;
    // Word-wrap
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(test, size);
      if (testWidth > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    for (const l of lines) {
      ensureSpace(size + 4);
      currentPage.page.drawText(l, { x, y: y - size, size, font, color });
      y -= size + 3;
    }
    return lines.length;
  }

  // Form title
  ensureSpace(40);
  y -= 10;
  const titleSize = 14;
  const titleWidth = helveticaBold.widthOfTextAtSize(form.officialName, titleSize);
  const titleX = Math.max(MARGIN, (PAGE_WIDTH - titleWidth) / 2);
  currentPage.page.drawText(form.officialName, { x: titleX, y, size: titleSize, font: helveticaBold, color: navyBlue });
  y -= titleSize + 6;

  // Prepared date
  const now = new Date();
  const dateStr = `Prepared on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
  const dateWidth = helvetica.widthOfTextAtSize(dateStr, 8);
  currentPage.page.drawText(dateStr, {
    x: (PAGE_WIDTH - dateWidth) / 2, y, size: 8, font: helvetica, color: midGray,
  });
  y -= 20;

  // Disclaimer box
  ensureSpace(36);
  currentPage.page.drawRectangle({ x: MARGIN, y: y - 28, width: COL_WIDTH, height: 32, color: warningAmber, borderColor: warningBorder, borderWidth: 1 });
  currentPage.page.drawText("IMPORTANT: This is a preparation document only. Review all fields, then transcribe or attach to the official form before submitting.", {
    x: MARGIN + 8, y: y - 20, size: 7.5, font: helvetica, color: warningText,
    maxWidth: COL_WIDTH - 16,
  });
  y -= 44;

  // Section: Completed Fields
  const filled = mappedFields.filter((f) => !f.isEmpty);
  const empty = mappedFields.filter((f) => f.isEmpty);

  ensureSpace(30);
  y -= 8;
  currentPage.page.drawRectangle({ x: MARGIN, y: y - 2, width: COL_WIDTH, height: 20, color: navyBlue });
  currentPage.page.drawText("COMPLETED FIELDS", { x: MARGIN + 8, y: y + 3, size: 10, font: helveticaBold, color: white });
  y -= 26;

  if (filled.length === 0) {
    drawText("No fields have been completed yet.", { color: midGray });
    y -= 6;
  } else {
    for (const field of filled) {
      ensureSpace(44);
      // Label
      currentPage.page.drawText(field.officialLabel.toUpperCase(), {
        x: MARGIN, y, size: 7.5, font: helveticaBold, color: midGray,
      });
      y -= 10;
      // Value box
      const boxH = 22;
      currentPage.page.drawRectangle({ x: MARGIN, y: y - boxH, width: COL_WIDTH, height: boxH, color: lightGray, borderColor: fieldBorder, borderWidth: 1 });
      const displayValue = field.value.length > 80 ? field.value.slice(0, 80) + "…" : field.value;
      currentPage.page.drawText(displayValue, { x: MARGIN + 6, y: y - 16, size: 10, font: helvetica, color: darkGray });
      y -= boxH + 8;
    }
  }

  // Section: Missing Fields
  if (empty.length > 0) {
    ensureSpace(30);
    y -= 8;
    currentPage.page.drawRectangle({ x: MARGIN, y: y - 2, width: COL_WIDTH, height: 20, color: errorRed });
    currentPage.page.drawText("INCOMPLETE / MISSING FIELDS", { x: MARGIN + 8, y: y + 3, size: 10, font: helveticaBold, color: white });
    y -= 26;

    for (const field of empty) {
      ensureSpace(44);
      currentPage.page.drawText(field.officialLabel.toUpperCase(), { x: MARGIN, y, size: 7.5, font: helveticaBold, color: errorRed });
      y -= 10;
      const boxH = 22;
      currentPage.page.drawRectangle({ x: MARGIN, y: y - boxH, width: COL_WIDTH, height: boxH, color: errorBg, borderColor: rgb(0.96, 0.78, 0.78), borderWidth: 1 });
      currentPage.page.drawText("[LEFT BLANK — Fill in before submitting]", {
        x: MARGIN + 6, y: y - 16, size: 9, font: helvetica, color: errorRed,
      });
      y -= boxH + 8;
    }
  }

  // Section: Required Documents
  ensureSpace(30);
  y -= 8;
  currentPage.page.drawRectangle({ x: MARGIN, y: y - 2, width: COL_WIDTH, height: 20, color: navyBlue });
  currentPage.page.drawText("REQUIRED DOCUMENTS", { x: MARGIN + 8, y: y + 3, size: 10, font: helveticaBold, color: white });
  y -= 26;

  form.requiredDocuments.forEach((doc, i) => {
    drawText(`${i + 1}. ${doc}`, { size: 9, maxWidth: COL_WIDTH - 4 });
    y -= 4;
  });

  // Footer disclaimer
  ensureSpace(56);
  y -= 10;
  currentPage.page.drawRectangle({ x: MARGIN, y: y - 46, width: COL_WIDTH, height: 50, color: lightGray, borderColor: fieldBorder, borderWidth: 1 });
  currentPage.page.drawText(form.disclaimer, {
    x: MARGIN + 6, y: y - 14, size: 7, font: helvetica, color: midGray, maxWidth: COL_WIDTH - 12,
  });

  return pdfDoc.save();
}
