export interface CreatePaymentCustomer {
  referenceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ip: string;
}

export interface CreatePaymentBillingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  countryCode: string;
  postalCode: string;
  state?: string;
}

export interface CreatePaymentPayload {
  amount: number;
  currency: string;
  referenceId: string;
  customer: CreatePaymentCustomer;
  billingAddress: CreatePaymentBillingAddress;
  returnUrl: string;
  webhookUrl: string;
}

export interface CreatePaymentResponse {
  result?: {
    id: string;
    redirectUrl?: string;
    state: string;
    paymentMethod: string;
    amount: number;
    currency: string;
  };
  error?: string;
  message?: string;
}

export class TransfermitAPI {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.TRANSFERMIT_API_KEY || "";
    // Note: Use app.transfermit.com API endpoint
    this.apiUrl = "https://app.transfermit.com/api/v1/payments";
  }

  /**
   * Create a deposit payment request
   */
  async createPayment(data: CreatePaymentPayload): Promise<CreatePaymentResponse> {
    if (!this.apiKey || this.apiKey === "your_api_key_here") {
      throw new Error("Transfermit API Key is not configured in .env file.");
    }

    const payload = {
      paymentType: "DEPOSIT",
      paymentMethod: "BASIC_CARD",
      amount: data.amount,
      currency: data.currency,
      description: `Order ${data.referenceId} payment`,
      referenceId: data.referenceId,
      customer: {
        referenceId: data.customer.referenceId,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        email: data.customer.email,
        phone: data.customer.phone,
        ip: data.customer.ip,
      },
      billingAddress: {
        addressLine1: data.billingAddress.addressLine1,
        addressLine2: data.billingAddress.addressLine2,
        city: data.billingAddress.city,
        countryCode: data.billingAddress.countryCode,
        postalCode: data.billingAddress.postalCode,
        state: data.billingAddress.state,
      },
      returnUrl: data.returnUrl,
      webhookUrl: data.webhookUrl,
    };

    console.log(`[Transfermit API] Sending request to ${this.apiUrl}`, JSON.stringify(payload, null, 2));

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Transfermit-NextJS/1.0.0",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`[Transfermit API] Response Status: ${response.status}`, responseText);

    if (!response.ok) {
      throw new Error(
        `Transfermit API request failed with status ${response.status}: ${responseText}`
      );
    }

    return JSON.parse(responseText);
  }
}
