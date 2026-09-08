/**
 * Live Government & Banking KYC Verification Engine for Navya Collection
 * Powered by Sandbox.co.in (NSDL PAN Database, GSTN Portal, and RBI Bank IMPS)
 */

export interface IfscLookupResult {
  isValid: boolean;
  bank?: string;
  branch?: string;
  city?: string;
  state?: string;
  address?: string;
  ifsc?: string;
  micr?: string;
  error?: string;
}

export interface PanVerificationResult {
  isValid: boolean;
  pan: string;
  entityType: string;
  entityCategory: 'INDIVIDUAL' | 'BUSINESS' | 'TRUST' | 'OTHER';
  status: 'VERIFIED_ACTIVE' | 'INVALID_PAN' | 'INVALID_FORMAT' | 'NAME_MISMATCH';
  message: string;
  details?: {
    letter4?: string;
    letter5?: string;
    registeredName?: string;
    surnameInitialMatch?: boolean;
  };
}

export interface GstVerificationResult {
  isValid: boolean;
  gstin: string;
  stateCode: string;
  stateName: string;
  panFromGst: string;
  panMatchesEnteredPan: boolean;
  status: 'VERIFIED_ACTIVE' | 'INVALID_GSTIN' | 'INVALID_FORMAT' | 'PAN_MISMATCH';
  message: string;
  details?: {
    entityType?: string;
    legalName?: string;
    tradeName?: string;
    taxpayerType?: string;
    status?: string;
  };
}

export interface BankVerificationResult {
  isValid: boolean;
  bankName: string;
  branch: string;
  city: string;
  state: string;
  ifsc: string;
  accountNumberMasked: string;
  status: 'VERIFIED' | 'INVALID_IFSC' | 'INVALID_ACCOUNT' | 'ACCOUNT_DOES_NOT_EXIST';
  message: string;
  beneficiaryName?: string;
}

// Indian GST State Code Mapping (01 to 38)
const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

// PAN 4th character entity mapping
const PAN_ENTITY_MAP: Record<
  string,
  { type: string; category: 'INDIVIDUAL' | 'BUSINESS' | 'TRUST' | 'OTHER' }
> = {
  P: { type: 'Individual / Sole Proprietor', category: 'INDIVIDUAL' },
  C: { type: 'Company (Private / Public Ltd)', category: 'BUSINESS' },
  H: { type: 'Hindu Undivided Family (HUF)', category: 'INDIVIDUAL' },
  F: { type: 'Partnership Firm / LLP', category: 'BUSINESS' },
  A: { type: 'Association of Persons (AOP)', category: 'OTHER' },
  T: { type: 'Trust', category: 'TRUST' },
  B: { type: 'Body of Individuals (BOI)', category: 'OTHER' },
  L: { type: 'Local Authority', category: 'OTHER' },
  J: { type: 'Artificial Juridical Person', category: 'OTHER' },
  G: { type: 'Government Entity', category: 'OTHER' },
};

// Token cache to avoid re-authenticating on every API call
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export class KycVerificationService {
  /**
   * Helper: Obtains a valid JWT access token from Sandbox.co.in
   */
  private static async getSandboxAccessToken(): Promise<string | null> {
    const apiKey = process.env.SANDBOX_API_KEY || 'key_live_be2766d441724763a474592e2efce7c1';
    const apiSecret =
      process.env.SANDBOX_API_SECRET ||
      process.env.SANDBOX_AUTH_TOKEN ||
      'secret_live_3096d4232e764874baa17b0672cacccb';

    if (!apiKey || !apiSecret) return null;

    const now = Date.now();
    if (cachedAccessToken && now < tokenExpiresAt - 60000) {
      return cachedAccessToken;
    }

    try {
      const res = await fetch('https://api.sandbox.co.in/authenticate', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'x-api-secret': apiSecret,
          'x-api-version': '1.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        console.error('[SANDBOX_AUTH_ERROR] Failed with status:', res.status);
        return null;
      }

      const json = await res.json();
      const token = json.access_token || json.data?.access_token;

      if (token) {
        cachedAccessToken = token;
        // Sandbox token is valid for 24 hours (86400 seconds)
        tokenExpiresAt = now + 23 * 60 * 60 * 1000;
        return token;
      }
      return null;
    } catch (err) {
      console.error('[SANDBOX_AUTH_EXCEPTION]', err);
      return null;
    }
  }

  /**
   * 1. Real-Time Public IFSC Lookup (Free, instant, reliable)
   */
  static async lookupIfsc(rawIfsc: string): Promise<IfscLookupResult> {
    const cleanIfsc = (rawIfsc || '').trim().toUpperCase();

    if (!cleanIfsc || cleanIfsc.length !== 11) {
      return {
        isValid: false,
        error: 'IFSC Code must be exactly 11 alphanumeric characters (e.g. SBIN0001234)',
      };
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      return {
        isValid: false,
        error: 'Invalid IFSC format. 5th character must be "0" (e.g. HDFC0001234)',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          isValid: false,
          error: `IFSC Code '${cleanIfsc}' was not found in RBI bank directory. Please check your bank passbook.`,
        };
      }

      const data = await res.json();

      return {
        isValid: true,
        bank: data.BANK || 'Bank',
        branch: data.BRANCH || '',
        city: data.CITY || '',
        state: data.STATE || '',
        address: data.ADDRESS || '',
        ifsc: data.IFSC || cleanIfsc,
        micr: data.MICR || '',
      };
    } catch {
      return {
        isValid: false,
        error: `Could not verify IFSC Code '${cleanIfsc}'. Please check the code or try again.`,
      };
    }
  }

  /**
   * 2. Live NSDL Government PAN Verification
   */
  static async verifyPan(rawPan: string, legalName?: string): Promise<PanVerificationResult> {
    const cleanPan = (rawPan || '').trim().toUpperCase();

    // Regex check: 5 letters, 4 numbers, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPan)) {
      return {
        isValid: false,
        pan: cleanPan,
        entityType: 'Unknown',
        entityCategory: 'OTHER',
        status: 'INVALID_FORMAT',
        message: 'Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F)',
      };
    }

    const fourthChar = cleanPan.charAt(3);
    const entityInfo = PAN_ENTITY_MAP[fourthChar] || {
      type: 'Registered Taxpayer',
      category: 'OTHER' as const,
    };

    // Query Live NSDL Database via Sandbox.co.in
    const token = await this.getSandboxAccessToken();
    const apiKey = process.env.SANDBOX_API_KEY || 'key_live_be2766d441724763a474592e2efce7c1';

    if (token) {
      try {
        const liveRes = await fetch(
          `https://api.sandbox.co.in/pans/${cleanPan}/verify?consent=Y&reason=Seller%20KYC%20Verification`,
          {
            method: 'GET',
            headers: {
              Authorization: token,
              'x-api-key': apiKey,
              'x-api-version': '1.0',
              'Content-Type': 'application/json',
            },
          },
        );

        const liveJson = await liveRes.json().catch(() => ({}));

        if (liveRes.ok && liveJson.data) {
          const panStatus = liveJson.data.status;
          const registeredName =
            liveJson.data.full_name || liveJson.data.name || liveJson.data.name_as_per_pan;

          if (panStatus === 'VALID') {
            return {
              isValid: true,
              pan: cleanPan,
              entityType: entityInfo.type,
              entityCategory: entityInfo.category,
              status: 'VERIFIED_ACTIVE',
              message: `PAN actively verified with Income Tax Department as ${entityInfo.type}.`,
              details: {
                letter4: fourthChar,
                registeredName: registeredName || legalName,
              },
            };
          } else {
            return {
              isValid: false,
              pan: cleanPan,
              entityType: entityInfo.type,
              entityCategory: entityInfo.category,
              status: 'INVALID_PAN',
              message: `PAN '${cleanPan}' is marked as INVALID in Income Tax Department records.`,
            };
          }
        }

        if (liveRes.status === 422 || liveRes.status === 404) {
          return {
            isValid: false,
            pan: cleanPan,
            entityType: entityInfo.type,
            entityCategory: entityInfo.category,
            status: 'INVALID_PAN',
            message:
              liveJson.message || `PAN '${cleanPan}' does not exist in NSDL / Income Tax records.`,
          };
        }
      } catch (err) {
        console.error('[LIVE_PAN_CHECK_ERROR]', err);
      }
    }

    // Fallback if API unreachable
    return {
      isValid: false,
      pan: cleanPan,
      entityType: entityInfo.type,
      entityCategory: entityInfo.category,
      status: 'INVALID_PAN',
      message: `Could not verify PAN with NSDL live database. Please ensure PAN number is correct.`,
    };
  }

  /**
   * 3. Live GST Portal Verification
   */
  static async verifyGstin(rawGstin: string, enteredPan?: string): Promise<GstVerificationResult> {
    const cleanGstin = (rawGstin || '').trim().toUpperCase();

    // GSTIN format: 2 digit state code + 10 digit PAN + 1 entity code + 'Z' + 1 checksum char
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGstin)) {
      return {
        isValid: false,
        gstin: cleanGstin,
        stateCode: '',
        stateName: '',
        panFromGst: '',
        panMatchesEnteredPan: false,
        status: 'INVALID_FORMAT',
        message: 'Invalid GSTIN format. Must be 15 characters (e.g. 06ABCDE1234F1Z5)',
      };
    }

    const stateCode = cleanGstin.substring(0, 2);
    const panFromGst = cleanGstin.substring(2, 12);
    const stateName = GST_STATE_CODES[stateCode] || 'Registered Indian State';

    let panMatchesEnteredPan = true;
    if (enteredPan && enteredPan.trim().length > 0) {
      panMatchesEnteredPan = panFromGst === enteredPan.trim().toUpperCase();
    }

    if (!panMatchesEnteredPan) {
      return {
        isValid: false,
        gstin: cleanGstin,
        stateCode,
        stateName,
        panFromGst,
        panMatchesEnteredPan: false,
        status: 'PAN_MISMATCH',
        message: `GSTIN belongs to PAN '${panFromGst}', which does not match your entered PAN '${enteredPan}'.`,
      };
    }

    // Query Live GST Portal via Sandbox.co.in
    const token = await this.getSandboxAccessToken();
    const apiKey = process.env.SANDBOX_API_KEY || 'key_live_be2766d441724763a474592e2efce7c1';

    if (token) {
      try {
        const liveRes = await fetch(`https://api.sandbox.co.in/gsp/public/gstin/${cleanGstin}`, {
          method: 'GET',
          headers: {
            Authorization: token,
            'x-api-key': apiKey,
            'x-api-version': '1.0',
            'Content-Type': 'application/json',
          },
        });

        const liveJson = await liveRes.json().catch(() => ({}));

        if (liveRes.ok && liveJson.data) {
          const gstData = liveJson.data;
          const status = gstData.status || gstData.sts || 'Active';
          const legalName = gstData.legal_name_of_business || gstData.lgnm || '';
          const tradeName = gstData.trade_name || gstData.tradeNam || '';

          if (status.toLowerCase().includes('active')) {
            return {
              isValid: true,
              gstin: cleanGstin,
              stateCode,
              stateName,
              panFromGst,
              panMatchesEnteredPan: true,
              status: 'VERIFIED_ACTIVE',
              message: `GSTIN verified on GST Portal: ${tradeName || legalName} (${stateName}).`,
              details: {
                legalName,
                tradeName,
                status: 'Active',
              },
            };
          } else {
            return {
              isValid: false,
              gstin: cleanGstin,
              stateCode,
              stateName,
              panFromGst,
              panMatchesEnteredPan: true,
              status: 'INVALID_GSTIN',
              message: `GSTIN '${cleanGstin}' status is '${status}' (Not Active on GST Portal).`,
            };
          }
        }

        if (liveRes.status === 404 || liveRes.status === 422) {
          return {
            isValid: false,
            gstin: cleanGstin,
            stateCode,
            stateName,
            panFromGst,
            panMatchesEnteredPan: true,
            status: 'INVALID_GSTIN',
            message: `GSTIN '${cleanGstin}' was not found on the official GST Portal.`,
          };
        }
      } catch (err) {
        console.error('[LIVE_GST_CHECK_ERROR]', err);
      }
    }

    return {
      isValid: false,
      gstin: cleanGstin,
      stateCode,
      stateName,
      panFromGst,
      panMatchesEnteredPan: true,
      status: 'INVALID_GSTIN',
      message: `Could not verify GSTIN with official GST Portal. Please check your GST number.`,
    };
  }

  /**
   * 4. Live Bank Account Verification (Penny Drop & RBI Account Validation)
   */
  static async verifyBankAccount(
    accountNumber: string,
    ifscCode: string,
    accountHolderName?: string,
  ): Promise<BankVerificationResult> {
    const cleanAccount = (accountNumber || '').trim();
    const cleanIfsc = (ifscCode || '').trim().toUpperCase();

    // 1. Verify IFSC with RBI directory
    const ifscResult = await this.lookupIfsc(cleanIfsc);
    if (!ifscResult.isValid) {
      return {
        isValid: false,
        bankName: '',
        branch: '',
        city: '',
        state: '',
        ifsc: cleanIfsc,
        accountNumberMasked: '',
        status: 'INVALID_IFSC',
        message: ifscResult.error || 'Invalid IFSC Code',
      };
    }

    // 2. Validate Account Number length & numeric format
    if (!/^\d{9,18}$/.test(cleanAccount)) {
      return {
        isValid: false,
        bankName: ifscResult.bank || '',
        branch: ifscResult.branch || '',
        city: ifscResult.city || '',
        state: ifscResult.state || '',
        ifsc: cleanIfsc,
        accountNumberMasked: '',
        status: 'INVALID_ACCOUNT',
        message: 'Bank account number must be between 9 and 18 numeric digits.',
      };
    }

    const maskedAccount = `XXXXXX${cleanAccount.slice(-4)}`;

    // Query Live Bank via Sandbox.co.in Penny Drop / Account Verification
    const token = await this.getSandboxAccessToken();
    const apiKey = process.env.SANDBOX_API_KEY || 'key_live_be2766d441724763a474592e2efce7c1';

    if (token) {
      try {
        const liveRes = await fetch(
          `https://api.sandbox.co.in/bank/${cleanIfsc}/accounts/${cleanAccount}/verify`,
          {
            method: 'GET',
            headers: {
              Authorization: token,
              'x-api-key': apiKey,
              'x-api-version': '1.0',
              'Content-Type': 'application/json',
            },
          },
        );

        const liveJson = await liveRes.json().catch(() => ({}));

        if (liveRes.ok && liveJson.data) {
          const bankData = liveJson.data;

          if (bankData.account_exists === true) {
            const beneficiaryName =
              bankData.full_name || bankData.name_at_bank || accountHolderName;

            return {
              isValid: true,
              bankName: ifscResult.bank || 'Bank',
              branch: ifscResult.branch || 'Branch',
              city: ifscResult.city || '',
              state: ifscResult.state || '',
              ifsc: cleanIfsc,
              accountNumberMasked: maskedAccount,
              status: 'VERIFIED',
              message: `Bank account actively verified with ${ifscResult.bank} (${ifscResult.branch}). Beneficiary: ${beneficiaryName}.`,
              beneficiaryName,
            };
          } else {
            return {
              isValid: false,
              bankName: ifscResult.bank || '',
              branch: ifscResult.branch || '',
              city: ifscResult.city || '',
              state: ifscResult.state || '',
              ifsc: cleanIfsc,
              accountNumberMasked: maskedAccount,
              status: 'ACCOUNT_DOES_NOT_EXIST',
              message:
                bankData.message ||
                `Account number '${cleanAccount}' does not exist at ${ifscResult.bank} (${ifscResult.branch}).`,
            };
          }
        }

        if (liveRes.status === 422 || liveRes.status === 400) {
          return {
            isValid: false,
            bankName: ifscResult.bank || '',
            branch: ifscResult.branch || '',
            city: ifscResult.city || '',
            state: ifscResult.state || '',
            ifsc: cleanIfsc,
            accountNumberMasked: maskedAccount,
            status: 'ACCOUNT_DOES_NOT_EXIST',
            message:
              liveJson.message || `Bank account validation failed for account '${cleanAccount}'.`,
          };
        }
      } catch (err) {
        console.error('[LIVE_BANK_CHECK_ERROR]', err);
      }
    }

    return {
      isValid: false,
      bankName: ifscResult.bank || '',
      branch: ifscResult.branch || '',
      city: ifscResult.city || '',
      state: ifscResult.state || '',
      ifsc: cleanIfsc,
      accountNumberMasked: maskedAccount,
      status: 'ACCOUNT_DOES_NOT_EXIST',
      message: `Could not verify bank account with banking network. Please verify your account number and IFSC.`,
    };
  }
}
