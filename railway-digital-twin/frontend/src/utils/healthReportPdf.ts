import { jsPDF } from "jspdf";

export async function saveHealthReportPdf(element: HTMLElement, filename: string): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  await doc.html(element, {
    x: 10,
    y: 8,
    width: 190,
    windowWidth: 820,
    html2canvas: {
      scale: 0.26,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    },
  });
  doc.save(filename);
}
