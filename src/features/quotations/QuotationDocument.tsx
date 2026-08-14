import "server-only";
import { Document, Text, View } from "@react-pdf/renderer";
import { LetterheadFrame, type LetterheadData } from "@/features/letterhead/Letterhead";
import { pdfMoney, pdfStyles } from "@/features/pdf/render";

export interface QuotationLine {
  product_code: string;
  description: string;
  unit: string | null;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
}

export interface QuotationDocumentData {
  reference: string;
  issueDate: string;
  expiresAt: string;
  recipientName: string;
  recipientCompany: string | null;
  recipientEmail: string | null;
  recipientAddress: string | null;
  notes: string | null;
  lines: QuotationLine[];
  subtotal: number;
  vatTotal: number;
  total: number;
}

const col = {
  code: { width: "16%" },
  description: { width: "38%" },
  qty: { width: "10%", textAlign: "right" as const },
  price: { width: "18%", textAlign: "right" as const },
  total: { width: "18%", textAlign: "right" as const },
};

/**
 * A quotation, printed onto the client's letterhead.
 *
 * The letterhead is a frame that takes children, so this is only the contents:
 * who it is for, what is being quoted, and what it comes to. Nothing here knows
 * about logos, addresses or bank accounts — that is the paper's job, and
 * keeping it that way is what lets a notice use the same paper later.
 */
export function QuotationDocument({
  letterhead,
  quotation,
}: {
  letterhead: LetterheadData;
  quotation: QuotationDocumentData;
}) {
  return (
    <Document title={`Quotation ${quotation.reference}`}>
      <LetterheadFrame data={letterhead}>
        <View style={pdfStyles.row}>
          <View style={{ maxWidth: 280 }}>
            <Text style={pdfStyles.label}>Quotation for</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 2 }}>
              {quotation.recipientCompany ?? quotation.recipientName}
            </Text>
            {quotation.recipientCompany ? <Text>{quotation.recipientName}</Text> : null}
            {quotation.recipientEmail ? (
              <Text style={pdfStyles.muted}>{quotation.recipientEmail}</Text>
            ) : null}
            {quotation.recipientAddress
              ? quotation.recipientAddress
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line) => (
                    <Text key={line} style={pdfStyles.muted}>
                      {line}
                    </Text>
                  ))
              : null}
          </View>

          <View style={{ textAlign: "right" }}>
            <Text style={pdfStyles.label}>Quotation</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 2 }}>
              {quotation.reference}
            </Text>
            <Text style={[pdfStyles.muted, { marginTop: 4 }]}>Issued {quotation.issueDate}</Text>
            {/* The expiry is the point of the document having a date at all. */}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Valid until {quotation.expiresAt}</Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <View style={[pdfStyles.row, { borderBottomWidth: 1, borderBottomColor: "#1c1c1c", paddingBottom: 4 }]}>
            <Text style={[pdfStyles.label, col.code]}>Code</Text>
            <Text style={[pdfStyles.label, col.description]}>Description</Text>
            <Text style={[pdfStyles.label, col.qty]}>Qty</Text>
            <Text style={[pdfStyles.label, col.price]}>Unit price</Text>
            <Text style={[pdfStyles.label, col.total]}>Total</Text>
          </View>

          {quotation.lines.map((line, index) => (
            <View
              key={`${line.product_code}-${index}`}
              style={[pdfStyles.row, pdfStyles.hairline, { paddingVertical: 5 }]}
              wrap={false}
            >
              <Text style={col.code}>{line.product_code}</Text>
              <Text style={col.description}>
                {line.description}
                {line.unit ? <Text style={pdfStyles.muted}> ({line.unit})</Text> : null}
              </Text>
              <Text style={col.qty}>{line.quantity}</Text>
              <Text style={col.price}>{pdfMoney(line.unit_price)}</Text>
              <Text style={col.total}>{pdfMoney(line.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 14, alignItems: "flex-end" }}>
          <View style={{ width: 220 }}>
            <View style={[pdfStyles.row, { paddingVertical: 2 }]}>
              <Text style={pdfStyles.muted}>Subtotal</Text>
              <Text>{pdfMoney(quotation.subtotal)}</Text>
            </View>
            <View style={[pdfStyles.row, { paddingVertical: 2 }]}>
              <Text style={pdfStyles.muted}>VAT</Text>
              <Text>{pdfMoney(quotation.vatTotal)}</Text>
            </View>
            <View
              style={[
                pdfStyles.row,
                { borderTopWidth: 1, borderTopColor: "#1c1c1c", marginTop: 4, paddingTop: 5 },
              ]}
            >
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{pdfMoney(quotation.total)}</Text>
            </View>
          </View>
        </View>

        {quotation.notes ? (
          <View style={{ marginTop: 20 }}>
            <Text style={pdfStyles.label}>Notes</Text>
            <Text style={{ marginTop: 3 }}>{quotation.notes}</Text>
          </View>
        ) : null}
      </LetterheadFrame>
    </Document>
  );
}
