type XenditConfig = {
  secretKey: string;
  webhookToken: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
};

type CreateInvoiceInput = {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  customerName?: string;
  customerPhone?: string | null;
};

type XenditInvoiceResponse = {
  id: string;
  external_id: string;
  status: string;
  invoice_url: string;
  expiry_date?: string;
};

function toBasicAuth(secretKey: string) {
  return Buffer.from(`${secretKey}:`).toString("base64");
}

function getTrimmedEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function getXenditConfig(): XenditConfig | null {
  const secretKey = getTrimmedEnv("XENDIT_SECRET_KEY");
  const webhookToken = getTrimmedEnv("XENDIT_WEBHOOK_TOKEN");
  const successRedirectUrl = getTrimmedEnv("XENDIT_SUCCESS_REDIRECT_URL");
  const failureRedirectUrl = getTrimmedEnv("XENDIT_FAILURE_REDIRECT_URL");

  if (!secretKey || !webhookToken || !successRedirectUrl || !failureRedirectUrl) {
    return null;
  }

  return {
    secretKey,
    webhookToken,
    successRedirectUrl,
    failureRedirectUrl,
  };
}

export async function createXenditInvoice(
  input: CreateInvoiceInput,
  config: XenditConfig,
) {
  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${toBasicAuth(config.secretKey)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      payer_email: input.payerEmail,
      description: input.description,
      success_redirect_url: input.successRedirectUrl ?? config.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl ?? config.failureRedirectUrl,
      currency: "IDR",
      customer: {
        given_names: input.customerName,
        email: input.payerEmail,
        mobile_number: input.customerPhone ?? undefined,
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | XenditInvoiceResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && "message" in payload && payload.message
        ? payload.message
        : `Xendit gagal membuat payment link (${response.status}).`;
    throw new Error(message);
  }

  if (!payload || !("invoice_url" in payload) || !payload.invoice_url) {
    throw new Error("Xendit tidak mengembalikan URL pembayaran.");
  }

  return payload;
}

export async function getXenditInvoiceById(
  invoiceId: string,
  config: XenditConfig,
) {
  const response = await fetch(
    `https://api.xendit.co/v2/invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${toBasicAuth(config.secretKey)}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | XenditInvoiceResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && "message" in payload && payload.message
        ? payload.message
        : `Xendit gagal mengambil invoice (${response.status}).`;
    throw new Error(message);
  }

  if (!payload || !("id" in payload) || !("invoice_url" in payload)) {
    throw new Error("Data invoice dari Xendit tidak valid.");
  }

  return payload;
}

export async function expireXenditInvoice(
  invoiceId: string,
  config: XenditConfig,
) {
  const response = await fetch(
    `https://api.xendit.co/v2/invoices/${encodeURIComponent(invoiceId)}/expire`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${toBasicAuth(config.secretKey)}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | XenditInvoiceResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && "message" in payload && payload.message
        ? payload.message
        : `Xendit gagal menutup invoice (${response.status}).`;
    throw new Error(message);
  }

  if (!payload || !("id" in payload) || !("status" in payload)) {
    throw new Error("Data respons expire invoice dari Xendit tidak valid.");
  }

  return payload;
}

export function mapXenditPaymentStatus(status: string | null | undefined): {
  paymentStatus: "PENDING" | "SETTLED" | "EXPIRED" | "FAILED" | "CANCELLED";
  orderStatus:
    | "PENDING_PAYMENT"
    | "PAID"
    | "EXPIRED"
    | "CANCELLED"
    | null;
} {
  const normalized = (status ?? "").trim().toUpperCase();

  if (["PAID", "SETTLED", "SUCCEEDED", "SUCCESS"].includes(normalized)) {
    return {
      paymentStatus: "SETTLED",
      orderStatus: "PAID",
    };
  }

  if (normalized === "EXPIRED") {
    return {
      paymentStatus: "EXPIRED",
      orderStatus: "EXPIRED",
    };
  }

  if (["FAILED", "FAILURE"].includes(normalized)) {
    return {
      paymentStatus: "FAILED",
      orderStatus: "CANCELLED",
    };
  }

  if (["CANCELLED", "CANCELED"].includes(normalized)) {
    return {
      paymentStatus: "CANCELLED",
      orderStatus: "CANCELLED",
    };
  }

  return {
    paymentStatus: "PENDING",
    orderStatus: "PENDING_PAYMENT",
  };
}
