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
  overallScore?: number | string;
  grade?: string;
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
  const score = data.overallScore || 95;
  const grade = data.grade || (Number(score) >= 90 ? 'A+' : Number(score) >= 80 ? 'A' : 'B+');

  // Background pure crisp white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // ==========================================
  // TOP-LEFT CORNER ACCENTS (TNV Green & Yellow)
  // ==========================================
  // Primary Forest Green Wave (#15803d)
  doc.setFillColor(21, 128, 61);
  doc.setDrawColor(21, 128, 61);
  doc.lines(
    [
      [55, 0],
      [-55, 38],
    ],
    0,
    0,
    [1, 1],
    "F"
  );
  // Secondary Golden Yellow Accent Curve (#eab308)
  doc.setFillColor(234, 179, 8);
  doc.setDrawColor(234, 179, 8);
  doc.lines(
    [
      [64, 0],
      [-64, 46],
      [9, -8],
    ],
    0,
    0,
    [1, 1],
    "F"
  );

  // ==========================================
  // BOTTOM-RIGHT CORNER ACCENTS (TNV Yellow & Green)
  // ==========================================
  // Secondary Golden Yellow Accent (#eab308)
  doc.setFillColor(234, 179, 8);
  doc.setDrawColor(234, 179, 8);
  doc.lines(
    [
      [-64, 0],
      [64, -46],
      [-9, 8],
    ],
    width,
    height,
    [1, 1],
    "F"
  );
  // Primary Forest Green Wave (#15803d)
  doc.setFillColor(21, 128, 61);
  doc.setDrawColor(21, 128, 61);
  doc.lines(
    [
      [-55, 0],
      [55, -38],
    ],
    width,
    height,
    [1, 1],
    "F"
  );

  // Outer Border
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1.2);
  doc.roundedRect(8, 8, width - 16, height - 16, 4, 4, "S");

  // Inner Subtle Decorative Border
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(0.4);
  doc.roundedRect(11, 11, width - 22, height - 22, 3, 3, "S");

  // ==========================================
  // TOP TNV EMBLEM / TN SYMBOL
  // ==========================================
  const emblemX = width / 2;
  const emblemY = 25;

  // Outer green ring
  doc.setDrawColor(21, 128, 61);
  doc.setFillColor(21, 128, 61);
  doc.circle(emblemX, emblemY, 11, "FD");

  // Gold middle ring
  doc.setDrawColor(234, 179, 8);
  doc.setFillColor(254, 240, 138); // amber-100
  doc.circle(emblemX, emblemY, 9, "FD");

  // Center crest text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(21, 128, 61);
  doc.text("TAMIL NADU", emblemX, emblemY - 2, { align: "center" });
  doc.setFontSize(7.5);
  doc.text("TNV", emblemX, emblemY + 2, { align: "center" });
  doc.setFontSize(5);
  doc.text("VOLUNTEERS", emblemX, emblemY + 5.5, { align: "center" });

  // ==========================================
  // HEADER TITLES
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(21, 128, 61); // TNV Brand Green
  doc.text("TNV WORKSHOP ACADEMY", width / 2, 43, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TAMIL NADU VOLUNTEERS  •  CENTRE OF SYSTEMS & SOFTWARE EXCELLENCE", width / 2, 48.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("CERTIFICATE OF INDUSTRY EXCELLENCE & COMPLETION", width / 2, 59, { align: "center" });

  // "This is proudly presented to"
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("This is proudly presented to", width / 2, 69, { align: "center" });

  // Student Full Name
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(data.studentName.toUpperCase(), width / 2, 82, { align: "center" });

  // Elegant divider line below name
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(0.6);
  doc.line(width / 2 - 60, 85.5, width / 2 + 60, 85.5);

  // College / Affiliation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const collegeInfo = data.collegeName || "TNV Workshop Academy of Technology";
  const deptInfo = data.department ? `${data.department}, ` : "";
  doc.text(`of ${deptInfo}${collegeInfo}`, width / 2, 92.5, { align: "center" });

  // Completion statement
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "for successfully completing 100% of the rigorous theoretical curriculum, practical coursework,",
    width / 2,
    103,
    { align: "center" }
  );
  doc.text(
    "technical assignments, laboratory milestones, and comprehensive evaluations in",
    width / 2,
    109.5,
    { align: "center" }
  );

  // Course Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(21, 128, 61); // Brand Green
  doc.text(data.workshopTitle, width / 2, 120, { align: "center" });

  // ==========================================
  // OVERALL SCORE & PERFORMANCE BANNER
  // ==========================================
  doc.setDrawColor(21, 128, 61);
  doc.setFillColor(240, 253, 244); // light green bg
  doc.roundedRect(width / 2 - 58, 127.5, 116, 9.5, 2.5, 2.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61);
  doc.text(`Course Completion: 100%   •   Overall Score: ${score}%   •   Grade: ${grade}`, width / 2, 134, { align: "center" });

  // Gold Seal / Emblem Representation (center bottom)
  doc.setDrawColor(234, 179, 8);
  doc.setFillColor(254, 243, 199);
  doc.circle(width / 2, 154, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text("VERIFIED", width / 2, 152.5, { align: "center" });
  doc.text("TNV ACADEMY", width / 2, 155.5, { align: "center" });
  doc.text("OFFICIAL", width / 2, 158.5, { align: "center" });

  // ==========================================
  // SIGNATURE BLOCKS
  // ==========================================
  // Left: Program Director (Thamilaran)
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(35, 174, 95, 174);

  doc.setFont("times", "bolditalic");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Thamilaran", 65, 171, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.signatoryName || "Thamilaran", 65, 179, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(data.signatoryTitle || "Program Director & Chief Architect", 65, 183.5, { align: "center" });

  // Right: Academic Council / Assessor
  doc.line(width - 95, 174, width - 35, 174);

  doc.setFont("times", "bolditalic");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Academic Evaluation Board", width - 65, 171, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Technical Assessment Council", width - 65, 179, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Tamil Nadu Volunteers Certification Authority", width - 65, 183.5, { align: "center" });

  // ==========================================
  // FOOTER METADATA
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certificate ID: ${data.certificateNumber}`, 25, height - 15);
  doc.text(`Issued: ${data.issueDate}`, width / 2, height - 15, { align: "center" });
  doc.text(`Verification Registry: /verify-certificate/${data.certificateNumber}`, width - 25, height - 15, { align: "right" });

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
