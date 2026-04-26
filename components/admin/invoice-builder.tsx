"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ISSUER = {
  name: "Texas A&M University Club Swimming",
  addressLine1: "187 Corrington Dr",
  addressLine2: "College Station, TX 77840",
};

const MAROON: [number, number, number] = [80, 0, 0]; // #500000
const CREAM: [number, number, number] = [248, 245, 241]; // #F8F5F1
const BORDER: [number, number, number] = [224, 217, 210]; // #E0D9D2
const INK: [number, number, number] = [40, 40, 40]; // #282828
const MUTED: [number, number, number] = [99, 96, 92]; // #63605C
const ACCENT: [number, number, number] = [193, 170, 143]; // #C1AA8F
const PAID_GREEN: [number, number, number] = [29, 108, 67];

type Status = "due" | "paid";

function buildInvoiceNumber(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function InvoiceBuilder() {
  const [recipientName, setRecipientName] = useState("");
  const [includeAddress, setIncludeAddress] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [status, setStatus] = useState<Status>("due");
  const [generating, setGenerating] = useState(false);

  const total = useMemo(
    () => Math.max(0, Number(quantity) || 0) * Math.max(0, Number(unitPrice) || 0),
    [quantity, unitPrice],
  );

  async function handleGenerate() {
    if (!recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 50;
      const contentW = pageW - margin * 2;
      const issuedAt = new Date();
      const invoiceNumber = buildInvoiceNumber(issuedAt);

      // White page background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, "F");

      // ── 1. Maroon header bar + cream/gold accent line
      doc.setFillColor(...MAROON);
      doc.rect(0, 0, pageW, 6, "F");
      doc.setFillColor(...ACCENT);
      doc.rect(0, 6, pageW, 3, "F");

      // ── 2. Logo (left) + Summary card (right)
      const topY = 40;
      const topH = 150;
      const logoW = 150;
      const gap = 22;
      const cardX = margin + logoW + gap;
      const cardW = pageW - margin - cardX;

      // Logo: block "A&M" with "CLUB SWIMMING" subtitle, vertically centered
      const logoCx = margin + logoW / 2;
      const logoCy = topY + topH / 2;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...MAROON);
      doc.setFontSize(60);
      doc.text("A&M", logoCx, logoCy, { align: "center" });
      doc.setFontSize(11);
      doc.setCharSpace(2);
      doc.text("CLUB SWIMMING", logoCx, logoCy + 26, { align: "center" });
      doc.setCharSpace(0);

      // Summary card — white with maroon top header strip
      const summaryHeaderH = 44;
      const cardR = 10;

      // Card body (white, full)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.6);
      doc.roundedRect(cardX, topY, cardW, topH, cardR, cardR, "FD");

      // Maroon top strip — top corners rounded, bottom flattened by overlay rect
      doc.setFillColor(...MAROON);
      doc.roundedRect(cardX, topY, cardW, summaryHeaderH, cardR, cardR, "F");
      doc.rect(cardX, topY + summaryHeaderH - cardR, cardW, cardR, "F");

      // "INVOICE" white text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("INVOICE", cardX + 18, topY + 30);

      // Body of summary card
      let yi = topY + summaryHeaderH + 18;
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Texas A&M University Club Swimming", cardX + 18, yi);
      yi += 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text("Official billing document", cardX + 18, yi);
      yi += 12;

      // Divider
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.5);
      doc.line(cardX + 18, yi, cardX + cardW - 18, yi);
      yi += 14;

      // Three rows: label (left, muted) → value (right, ink)
      const labelX = cardX + 18;
      const valueX = cardX + cardW - 18;
      const rowGap = 17;

      const drawRow = (
        label: string,
        value: string,
        valueColor: [number, number, number] = INK,
      ) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...MUTED);
        doc.text(label, labelX, yi);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...valueColor);
        doc.text(value, valueX, yi, { align: "right" });
        yi += rowGap;
      };

      drawRow("Invoice Number", invoiceNumber);
      drawRow("Invoice Date", formatDate(issuedAt));
      drawRow(
        "Status",
        status === "paid" ? "PAID" : "DUE",
        status === "paid" ? PAID_GREEN : MAROON,
      );

      // ── 3. Accent divider
      let y = topY + topH + 22;
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(1);
      doc.line(margin, y, pageW - margin, y);
      y += 26;

      // ── 4. Bill To / Issued By cards
      const partyGap = 16;
      const partyW = (contentW - partyGap) / 2;
      const partyH = 100;
      const billX = margin;
      const issuerX = margin + partyW + partyGap;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.6);
      doc.roundedRect(billX, y, partyW, partyH, 8, 8, "FD");
      doc.roundedRect(issuerX, y, partyW, partyH, 8, 8, "FD");

      // BILL TO
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...MAROON);
      doc.setCharSpace(1);
      doc.text("BILL TO", billX + 16, y + 22);
      doc.setCharSpace(0);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...INK);
      doc.text(recipientName, billX + 16, y + 42, {
        maxWidth: partyW - 32,
      });

      if (includeAddress && recipientAddress.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...MUTED);
        let ay = y + 60;
        const lines = recipientAddress
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const line of lines) {
          doc.text(line, billX + 16, ay, { maxWidth: partyW - 32 });
          ay += 13;
        }
      }

      // ISSUED BY
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...MAROON);
      doc.setCharSpace(1);
      doc.text("ISSUED BY", issuerX + 16, y + 22);
      doc.setCharSpace(0);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...INK);
      doc.text(ISSUER.name, issuerX + 16, y + 42, {
        maxWidth: partyW - 32,
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...MUTED);
      doc.text(ISSUER.addressLine1, issuerX + 16, y + 60);
      doc.text(ISSUER.addressLine2, issuerX + 16, y + 73);

      y += partyH + 28;

      // ── 5. Itemized Charges title + table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...INK);
      doc.text("Itemized Charges", margin, y);
      y += 14;

      autoTable(doc, {
        startY: y,
        head: [["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
        body: [
          [
            description,
            String(quantity),
            formatMoney(Number(unitPrice) || 0),
            formatMoney(total),
          ],
        ],
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 10,
          textColor: INK,
          lineColor: BORDER,
          lineWidth: 0.5,
          valign: "middle",
        },
        headStyles: {
          fillColor: MAROON,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9.5,
          halign: "left",
          cellPadding: { top: 10, right: 10, bottom: 10, left: 10 },
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 50, halign: "center" },
          2: { cellWidth: 90, halign: "right" },
          3: { cellWidth: 90, halign: "right" },
        },
      });

      const tableEndY =
        (doc as unknown as { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY ?? y;
      y = tableEndY + 22;

      // ── 6. Total card (cream/tan, right-aligned)
      const totalCardW = 230;
      const totalCardH = 78;
      const totalCardX = pageW - margin - totalCardW;
      doc.setFillColor(...CREAM);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.6);
      doc.roundedRect(totalCardX, y, totalCardW, totalCardH, 10, 10, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.setCharSpace(1);
      doc.text(
        status === "paid" ? "AMOUNT PAID" : "AMOUNT DUE",
        totalCardX + 18,
        y + 26,
      );
      doc.setCharSpace(0);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(...MAROON);
      doc.text(formatMoney(total), totalCardX + totalCardW - 18, y + 58, {
        align: "right",
      });

      // ── 7. Footer
      const footerLineY = pageH - 70;
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(1);
      doc.line(margin, footerLineY, pageW - margin, footerLineY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      const footerText =
        status === "paid"
          ? "Payment has been received and applied to this invoice. Reference the invoice number above for your records."
          : "Please remit payment to Texas A&M University Club Swimming and reference the invoice number above.";
      doc.text(footerText, pageW / 2, footerLineY + 22, {
        align: "center",
        maxWidth: contentW,
      });

      doc.save(`invoice-${invoiceNumber}.pdf`);
      toast.success("Invoice downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="recipientName">Recipient name</Label>
          <Input
            id="recipientName"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Acme Co."
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={includeAddress}
            onChange={(e) => setIncludeAddress(e.target.checked)}
          />
          Include recipient address
        </label>

        {includeAddress ? (
          <div className="grid gap-1.5">
            <Label htmlFor="recipientAddress">Recipient address</Label>
            <textarea
              id="recipientAddress"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              rows={3}
              placeholder="123 Main St&#10;Anytown, USA 12345"
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <Label htmlFor="description">Transaction / service description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Sponsorship of fall meet"
            required
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="unitPrice">Unit price (USD)</Label>
            <Input
              id="unitPrice"
              type="number"
              min={0}
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Total</Label>
            <div className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm font-semibold">
              {formatMoney(total)}
            </div>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Status</Label>
          <div className="inline-flex w-fit overflow-hidden rounded-lg border">
            <button
              type="button"
              onClick={() => setStatus("due")}
              className={`px-4 py-1.5 text-sm ${
                status === "due"
                  ? "bg-[#500000] text-white"
                  : "bg-transparent text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Amount Due
            </button>
            <button
              type="button"
              onClick={() => setStatus("paid")}
              className={`px-4 py-1.5 text-sm ${
                status === "paid"
                  ? "bg-green-700 text-white"
                  : "bg-transparent text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Amount Paid
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          A new invoice number is generated each time you click below
          (YYYYMMDD-HHmmss).
        </p>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate PDF"}
        </Button>
      </div>
    </div>
  );
}
