import type { LightMyRequestResponse } from 'fastify';
import { baueApp } from '../src/server.ts';
import { oeffneDatenbank } from '../src/datenbank.ts';
import { neuerEinrichtungscode } from '../src/konto.ts';

export const PASSWORT = 'ein-langes-passwort';
export const KOPF = { 'content-type': 'application/json', 'x-lichtung': '1' };

export async function neueApp() {
  const db = oeffneDatenbank(':memory:');
  const app = await baueApp({ datenbank: db });
  return { app, db };
}
export type TestApp = Awaited<ReturnType<typeof neueApp>>['app'];

export function post(app: TestApp, url: string, payload: unknown = {}, extra: { cookie?: string; ip?: string } = {}) {
  return app.inject({
    method: 'POST',
    url,
    payload: payload as object,
    remoteAddress: extra.ip,
    headers: { ...KOPF, ...(extra.cookie ? { cookie: extra.cookie } : {}) },
  });
}

export function sitzungsCookie(antwort: LightMyRequestResponse): string {
  const c = antwort.cookies.find((k) => k.name === 'lichtung_sitzung');
  if (!c) throw new Error('kein Sitzungs-Cookie');
  return `lichtung_sitzung=${c.value}`;
}

/** App mit eingerichtetem Konto und angemeldeter Sitzung. */
export async function angemeldeteApp() {
  const { app, db } = await neueApp();
  const code = neuerEinrichtungscode(db);
  const r = await post(app, '/api/einrichten', { code, passwort: PASSWORT });
  if (r.statusCode !== 200) throw new Error(r.body);
  return { app, db, cookie: sitzungsCookie(r) };
}

export function put(app: TestApp, url: string, payload: unknown, cookie: string) {
  return app.inject({ method: 'PUT', url, payload: payload as object, headers: { ...KOPF, cookie } });
}

export function get(app: TestApp, url: string, cookie?: string) {
  return app.inject({ method: 'GET', url, headers: cookie ? { cookie } : {} });
}

export const stand = (tag: number, extra: object = {}) => ({ version: 3, siedlung: { tag }, ...extra });
