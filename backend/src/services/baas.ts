import axios, { AxiosInstance } from "axios";
import { config } from "../config/env";

class BaasClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.baas.url,
      headers: {
        Authorization: `Bearer ${config.baas.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
  }

  // OTP

  async generateOtp(
    email: string,
    appName: string,
    fromName: string
  ): Promise<{ message: string }> {
    const { data } = await this.http.post("/v1/otp/generate", {
      email,
      app_name: appName,
      from_name: fromName,
    });
    return data;
  }

  async verifyOtp(
    email: string,
    codigo: string
  ): Promise<{ valido: boolean; message: string }> {
    const { data } = await this.http.post("/v1/otp/verify", {
      email,
      codigo,
    });
    return data;
  }

  async resendOtp(
    email: string,
    appName: string,
    fromName: string
  ): Promise<{ message: string }> {
    const { data } = await this.http.post("/v1/otp/resend", {
      email,
      app_name: appName,
      from_name: fromName,
    });
    return data;
  }

  // JWT

  async signJwt(
    userId: string,
    claims: Record<string, unknown>,
    ttlSecs: number = 86400
  ): Promise<{ token: string }> {
    const { data } = await this.http.post("/v1/jwt/sign", {
      user_id: userId,
      app_id: config.jwtAppId,
      claims,
      ttl_secs: ttlSecs,
    });
    return data;
  }

  async verifyJwt(
    token: string
  ): Promise<{
    valid: boolean;
    claims: {
      sub: string;
      app_id: string;
      iat: number;
      exp: number;
      extra: Record<string, unknown>;
    };
  }> {
    const { data } = await this.http.post("/v1/jwt/verify", { token });
    return data;
  }

  async getJwtPublicKey(): Promise<{ pem: string; algorithm: string }> {
    const { data } = await this.http.get("/v1/jwt/public-key");
    return data;
  }

  // Google OAuth2

  async verifyGoogleToken(
    accessToken: string
  ): Promise<{
    email: string;
    name: string;
    picture: string;
    provider_id: string;
    provider: string;
  }> {
    const { data } = await this.http.post("/v1/oauth/google", {
      access_token: accessToken,
    });
    return data;
  }

  // TOTP (2FA)

  async generateTotp(
    appName: string,
    userEmail: string
  ): Promise<{ secret: string; qr_svg: string; uri: string }> {
    const { data } = await this.http.post("/v1/totp/generate", {
      app_name: appName,
      user_email: userEmail,
    });
    return data;
  }

  async verifyTotp(
    secret: string,
    code: string
  ): Promise<{ valid: boolean }> {
    const { data } = await this.http.post("/v1/totp/validate", {
      secret,
      code,
    });
    return data;
  }

  // Email

  async sendEmail(
    to: string,
    fromName: string,
    subject: string,
    htmlBody: string
  ): Promise<{ message: string }> {
    const { data } = await this.http.post("/v1/send", {
      to,
      from_name: fromName,
      subject,
      html_body: htmlBody,
    });
    return data;
  }

  async sendTemplateEmail(
    to: string,
    fromName: string,
    subject: string,
    template: string,
    templateData: Record<string, string>
  ): Promise<{ message: string }> {
    const { data } = await this.http.post("/v1/send-template", {
      to,
      from_name: fromName,
      subject,
      template,
      data: templateData,
    });
    return data;
  }
}

export const baas = new BaasClient();
