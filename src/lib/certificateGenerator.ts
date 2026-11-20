import { jsPDF } from "jspdf";
import confetti from "canvas-confetti";

export interface CertificateData {
  studentName: string;
  collegeName?: string;
  department?: string;
  workshopTitle: string;
  certificateNumber: string;
  completionDate: string;
  issueDate: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

export function generateCertificatePDF(data: CertificateData): jsPDF {
  // Landscape A4 orientation: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = 297;
  const height = 210;

  // Background subtle cream
  doc.setFillColor(252, 253, 255);
  doc.rect(0, 0, width, height, "F");

  // Outer Decorative Navy Border
  doc.setDrawColor(15, 23, 42); // slate-900 / navy
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner Gold Border
  doc.setDrawColor(217, 119, 6); // Amber / Gold
  doc.setLineWidth(0.8);
  doc.rect(13, 13, width - 26, height - 26);

  // Corner Accents
  const cornerSize = 12;
  doc.setDrawColor(217, 119, 6);
  doc.setFillColor(217, 119, 6);
  
  // Top-left corner ornament
  doc.triangle(13, 13, 13 + cornerSize, 13, 13, 13 + cornerSize, "FD");
  // Top-right corner ornament
  doc.triangle(width - 13, 13, width - 13 - cornerSize, 13, width - 13, 13 + cornerSize, "FD");
  // Bottom-left corner ornament
  doc.triangle(13, height - 13, 13 + cornerSize, height - 13, 13, height - 13 - cornerSize, "FD");
  // Bottom-right corner ornament
  doc.triangle(width - 13, height - 13, width - 13 - cornerSize, height - 13, width - 13, height - 13 - cornerSize, "FD");

  // Header Organization Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text("TNV WORKSHOP", width / 2, 34, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("ACADEMY OF ADVANCED SOFTWARE & SYSTEMS ENGINEERING", width / 2, 41, { align: "center" });

  // Ribbon / Title Banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(217, 119, 6);
  doc.text("CERTIFICATE OF INDUSTRY EXCELLENCE", width / 2, 56, { align: "center" });

  // "This is to certify that"
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("This is proudly presented to", width / 2, 68, { align: "center" });

  // Student Full Name
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  doc.text(data.studentName.toUpperCase(), width / 2, 83, { align: "center" });

  // Line below name
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 70, 87, width / 2 + 70, 87);

  // College / Affiliation
  if (data.collegeName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    const deptInfo = data.department ? `${data.department}, ` : "";
    doc.text(`of ${deptInfo}${data.collegeName}`, width / 2, 95, { align: "center" });
  }

  // Completion statement
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "for successfully completing the rigorous theoretical curriculum, hands-on modules,",
    width / 2,
    108,
    { align: "center" }
  );
  doc.text(
    "technical assignments, comprehensive examinations, and capstone project in",
    width / 2,
    115,
    { align: "center" }
  );

  // Workshop Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175); // Brand blue
  doc.text(data.workshopTitle, width / 2, 126, { align: "center" });

  // Gold Seal / Emblem Representation (center bottom)
  doc.setDrawColor(217, 119, 6);
  doc.setFillColor(254, 243, 199);
  doc.circle(width / 2, 152, 12, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text("VERIFIED", width / 2, 150, { align: "center" });
  doc.text("TNV", width / 2, 154, { align: "center" });
  doc.text("OFFICIAL", width / 2, 157, { align: "center" });

  // Signature Block Left - Director
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(35, 176, 95, 176);

  doc.setFont("times", "bolditalic");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Dr. T. N. Venkatesh", 65, 173, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(data.signatoryName || "Dr. T. N. Venkatesh", 65, 182, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(data.signatoryTitle || "Program Director & Chief Architect", 65, 187, { align: "center" });

  // Signature Block Right - Academic Council
  doc.line(width - 95, 176, width - 35, 176);

  doc.setFont("times", "bolditalic");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Academic Evaluation Board", width - 65, 173, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Lead Technical Assessor", width - 65, 182, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TNV Academic Council", width - 65, 187, { align: "center" });

  // Footer Metadata: Certificate ID & Dates
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certificate ID: ${data.certificateNumber}`, 25, height - 16);
  doc.text(`Issued: ${data.issueDate}`, width / 2, height - 16, { align: "center" });
  doc.text(`Verify at: /verify-certificate/${data.certificateNumber}`, width - 25, height - 16, { align: "right" });

  return doc;
}

export function downloadCertificate(data: CertificateData): void {
  const doc = generateCertificatePDF(data);
  const fileName = `TNV-Certificate-${data.certificateNumber}.pdf`;
  doc.save(fileName);

  // Trigger celebration confetti
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  } catch (e) {
    // Ignore confetti errors if DOM is busy
  }
}
