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
const TEXT: [number, number, number] = [33, 33, 33];
const MUTED: [number, number, number] = [120, 120, 120];

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

export function InvoiceBuilder({ issuerName }: { issuerName: string | null }) {
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
      const issuedAt = new Date();
      const invoiceNumber = buildInvoiceNumber(issuedAt);

      // ── Cream background for the whole page
      doc.setFillColor(...CREAM);
      doc.rect(0, 0, pageW, pageH, "F");

      // ── Maroon header bar
      const headerH = 90;
      doc.setFillColor(...MAROON);
      doc.rect(0, 0, pageW, headerH, "F");

      // Logo/text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("TEXAS A&M CLUB SWIMMING", margin, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Aggie Swim & Dive · Est. 1991", margin, 60);

      // INVOICE label right-aligned
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("INVOICE", pageW - margin, 50, { align: "right" });

      // ── Summary card
      let y = headerH + 28;
      const summaryH = 70;
      drawCard(doc, margin, y, pageW - margin * 2, summaryH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text("INVOICE #", margin + 16, y + 22);
      doc.text("DATE", margin + 200, y + 22);
      doc.text("STATUS", pageW - margin - 16, y + 22, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...TEXT);
      doc.text(invoiceNumber, margin + 16, y + 46);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(issuedAt), margin + 200, y + 46);

      // Status chip
      const chipText =
        status === "paid" ? "AMOUNT PAID" : "AMOUNT DUE";
      const chipFill: [number, number, number] =
        status === "paid" ? [34, 139, 34] : MAROON;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const chipW = doc.getTextWidth(chipText) + 18;
      const chipH = 18;
      const chipX = pageW - margin - 16 - chipW;
      const chipY = y + 36;
      doc.setFillColor(...chipFill);
      doc.roundedRect(chipX, chipY, chipW, chipH, 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(chipText, chipX + chipW / 2, chipY + 12, { align: "center" });

      y += summaryH + 20;

      // ── Bill To / Issued By cards
      const colGap = 16;
      const colW = (pageW - margin * 2 - colGap) / 2;
      const partyH = 110;
      drawCard(doc, margin, y, colW, partyH);
      drawCard(doc, margin + colW + colGap, y, colW, partyH);

      drawPartyHeading(doc, "BILL TO", margin + 16, y + 22);
      drawPartyBlock(doc, margin + 16, y + 42, [
        recipientName,
        ...(includeAddress && recipientAddress.trim()
          ? recipientAddress.split("\n").map((s) => s.trim()).filter(Boolean)
          : []),
      ]);

      drawPartyHeading(
        doc,
        "ISSUED BY",
        margin + colW + colGap + 16,
        y + 22,
      );
      drawPartyBlock(doc, margin + colW + colGap + 16, y + 42, [
        ISSUER.name,
        ISSUER.addressLine1,
        ISSUER.addressLine2,
        ...(issuerName ? [`Prepared by ${issuerName}`] : []),
      ]);

      y += partyH + 24;

      // ── Line items table
      autoTable(doc, {
        startY: y,
        head: [["Description", "Qty", "Unit Price", "Total"]],
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
          cellPadding: 8,
          textColor: TEXT,
          lineColor: [220, 220, 220],
        },
        headStyles: {
          fillColor: MAROON,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 50, halign: "center" },
          2: { cellWidth: 90, halign: "right" },
          3: { cellWidth: 90, halign: "right" },
        },
      });

      // After the table
      const lastY =
        (
          doc as unknown as { lastAutoTable?: { finalY: number } }
        ).lastAutoTable?.finalY ?? y;
      y = lastY + 24;

      // ── Total card
      const totalCardW = 240;
      const totalCardH = 70;
      const totalCardX = pageW - margin - totalCardW;
      doc.setFillColor(...MAROON);
      doc.roundedRect(totalCardX, y, totalCardW, totalCardH, 6, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        status === "paid" ? "AMOUNT PAID" : "AMOUNT DUE",
        totalCardX + 18,
        y + 26,
      );
      doc.setFontSize(22);
      doc.text(formatMoney(total), totalCardX + totalCardW - 18, y + 50, {
        align: "right",
      });

      // ── Footer
      const footerY = pageH - 60;
      doc.setDrawColor(...MAROON);
      doc.setLineWidth(2);
      doc.line(margin, footerY, pageW - margin, footerY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...MAROON);
      doc.text("PAYMENT INSTRUCTIONS", margin, footerY + 16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT);
      doc.setFontSize(9);
      doc.text(
        status === "paid"
          ? "This invoice has been marked PAID. No further action required. Thanks for your support of Texas A&M Club Swimming!"
          : "Please remit payment via Venmo @TAMUClubSwim or by check made out to Texas A&M Club Swimming. Reference the invoice number above.",
        margin,
        footerY + 30,
        { maxWidth: pageW - margin * 2 },
      );

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

function drawCard(
  doc: import("jspdf").jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 220, 210);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 6, 6, "FD");
}

function drawPartyHeading(
  doc: import("jspdf").jsPDF,
  label: string,
  x: number,
  y: number,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(label, x, y);
}

function drawPartyBlock(
  doc: import("jspdf").jsPDF,
  x: number,
  y: number,
  lines: string[],
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  let cursor = y;
  for (const line of lines) {
    doc.text(line, x, cursor);
    cursor += 14;
  }
}
