import "server-only";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { pdfStyles } from "@/features/pdf/render";

export interface LetterheadData {
  tradingName: string;
  registeredName: string;
  registrationNumber: string | null;
  vatNumber: string | null;
  vatStatus: string | null;
  address: string[];
  /** PDF-ready artwork source, or null when none was supplied. */
  logoUrl: string | Buffer | null;

  /** From the onboarding record: the primary contact and their job title. */
  directorName: string | null;
  directorTitle: string | null;

  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  footerNote: string | null;

  banking: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string | null;
    swiftCode: string | null;
  } | null;

  showBanking: boolean;
  showRegistration: boolean;
  showDirector: boolean;
}

/**
 * The client's letterhead, as a frame rather than a page.
 *
 * A quotation and a notice are the same paper with different contents, so the
 * letterhead takes children and puts them between its head and its foot. That
 * is what makes it an artefact documents are rendered *onto* rather than a
 * document of its own.
 *
 * Everything here is read live rather than snapshotted. A letterhead that
 * captured the address on the day it was created would be wrong the first time
 * the client moved, and would be wrong silently.
 */
export function LetterheadFrame({
  data,
  children,
}: {
  data: LetterheadData;
  children?: ReactNode;
}) {
  const contacts = [data.contactPhone, data.contactEmail, data.website].filter(Boolean);
  const registration = [
    data.registrationNumber ? `Reg ${data.registrationNumber}` : null,
    data.vatStatus === "registered" && data.vatNumber ? `VAT ${data.vatNumber}` : null,
  ].filter(Boolean);

  return (
    <Page size="A4" style={pdfStyles.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ maxWidth: 300 }}>
          {/* The logo is optional and the header must not collapse without it,
              so the name carries the identity either way. */}
          {data.logoUrl ? (
            /* react-pdf's Image is not an HTML img and takes no alt prop; the
               rule cannot tell them apart. The logo is decorative here — the
               name beside it carries the identity. */
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.logoUrl} style={{ maxHeight: 46, maxWidth: 180, marginBottom: 10, objectFit: "contain" }} />
          ) : null}
          <Text style={pdfStyles.heading}>{data.tradingName}</Text>
          {data.registeredName !== data.tradingName ? (
            <Text style={[pdfStyles.muted, { fontSize: 9 }]}>{data.registeredName}</Text>
          ) : null}
        </View>

        <View style={{ maxWidth: 200, textAlign: "right" }}>
          {data.address.map((line) => (
            <Text key={line} style={{ fontSize: 9 }}>{line}</Text>
          ))}
          {contacts.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {contacts.map((line) => (
                <Text key={line as string} style={[pdfStyles.muted, { fontSize: 9 }]}>{line}</Text>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={pdfStyles.rule} />

      {/* Whatever this letterhead is carrying today. */}
      <View style={{ flexGrow: 1 }}>{children}</View>

      <View style={pdfStyles.footer} fixed>
        <View style={pdfStyles.hairline} />
        <View style={{ marginTop: 6 }}>
          {data.showDirector && data.directorName ? (
            <Text>
              {data.directorTitle ? `${data.directorTitle}: ` : "Director: "}
              {data.directorName}
            </Text>
          ) : null}

          {data.showRegistration && registration.length > 0 ? (
            <Text>{registration.join("  ·  ")}</Text>
          ) : null}

          {data.showBanking && data.banking ? (
            <Text>
              {[
                data.banking.bankName,
                data.banking.accountName,
                `Acc ${data.banking.accountNumber}`,
                `Branch ${data.banking.branchCode}`,
                data.banking.accountType,
                data.banking.swiftCode ? `SWIFT ${data.banking.swiftCode}` : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>
          ) : null}

          {data.footerNote ? <Text style={{ marginTop: 3 }}>{data.footerNote}</Text> : null}
        </View>

        <Text
          style={{ marginTop: 4 }}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </View>
    </Page>
  );
}

/**
 * The letterhead on its own, which is what the client downloads to check it.
 *
 * Blank on purpose: this is the paper, and seeing it empty is how you tell
 * whether the paper is right before anything is written on it.
 */
export function LetterheadDocument({ data }: { data: LetterheadData }) {
  return (
    <Document title={`${data.tradingName} letterhead`}>
      <LetterheadFrame data={data}>
        <View style={{ marginTop: 40 }}>
          <Text style={[pdfStyles.muted, { fontSize: 9 }]}>
            This is your letterhead with nothing on it. Quotations and notices are printed onto
            this same paper.
          </Text>
        </View>
      </LetterheadFrame>
    </Document>
  );
}
