import VERSION from "../version";

export class PluginData {
    public static APP_ID = "fun-shiro-ytmd";
    public static APP_NAME = "Monstar Daeck YTMD Connector";
    public static APP_VERSION = VERSION;
    public static DEFAULT_HOST = "127.0.0.1";
    public static DEFAULT_PORT = 26538;

    public static normalizeHost(host?: string | null): string {
        const value = (host ?? "").trim();
        if (!value || value === "localhost") {
            return PluginData.DEFAULT_HOST;
        }
        return value;
    }

    public static parsePort(raw: string | number | undefined | null, fallback = PluginData.DEFAULT_PORT): number {
        const n = typeof raw === "number" ? Math.trunc(raw) : parseInt(String(raw ?? "").trim(), 10);
        if (!Number.isFinite(n) || n < 1 || n > 65535) {
            return fallback;
        }
        return n;
    }
}
