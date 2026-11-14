import { describe, expect, it } from 'vitest';
import { neuerEinrichtungscode } from '../src/konto.ts';
import { passwortZuruecksetzen } from '../src/passwort.ts';
import { PASSWORT, get, neueApp, post, put, sitzungsCookie, stand, angemeldeteApp } from './hilfen.ts';

describe('Einrichten', () => {
  it('geht nur mit dem Code', async () => {
    const { app, db } = await neueApp();
    const code = neuerEinrichtungscode(db);
    const falsch = code === '000000' ? '111111' : '000000';
    const r = await post(app, '/api/einrichten', { code: falsch, passwort: PASSWORT });
    expect(r.statusCode).toBe(403);
    expect(r.json().fehler).toBe('Code stimmt nicht');
    expect((await get(app, '/api/ich')).json()).toEqual({ eingerichtet: false, angemeldet: false });
  });

  it('verbraucht den Code und meldet an', async () => {
    const { app, db } = await neueApp();
    const code = neuerEinrichtungscode(db);
    const mitLeerzeichen = `${code.slice(0, 3)} ${code.slice(3)}`;
    const r = await post(app, '/api/einrichten', { code: mitLeerzeichen, passwort: PASSWORT });
    expect(r.statusCode).toBe(200);
    const cookie = sitzungsCookie(r);
    expect((await get(app, '/api/ich', cookie)).json()).toEqual({ eingerichtet: true, angemeldet: true });

    const nochmal = await post(app, '/api/einrichten', { code, passwort: PASSWORT });
    expect(nochmal.statusCode).toBe(409);
    expect(nochmal.json().fehler).toBe('Lichtung ist schon eingerichtet');
  });

  it('lehnt zu kurze Passwörter ab und behält den Code', async () => {
    const { app, db } = await neueApp();
    const code = neuerEinrichtungscode(db);
    const r = await post(app, '/api/einrichten', { code, passwort: 'kurz' });
    expect(r.statusCode).toBe(400);
    expect(r.json().fehler).toBe('Passwort braucht mindestens 10 Zeichen');
    expect((await post(app, '/api/einrichten', { code, passwort: PASSWORT })).statusCode).toBe(200);
  });

  it('speichert weder Passwort noch Code im Klartext', async () => {
    const { db } = await angemeldeteApp();
    const hash = (db.prepare('SELECT hash FROM konto').get() as { hash: string }).hash;
    expect(hash.startsWith('scrypt$32768$8$1$')).toBe(true);
    expect(hash).not.toContain(PASSWORT);
  });
});

describe('Anmelden', () => {
  it('setzt ein sicheres Cookie und lehnt ein falsches Passwort ab', async () => {
    const { app } = await angemeldeteApp();
    const falsch = await post(app, '/api/anmelden', { passwort: 'falsches-passwort' });
    expect(falsch.statusCode).toBe(401);
    expect(falsch.json().fehler).toBe('Passwort stimmt nicht');

    const r = await post(app, '/api/anmelden', { passwort: PASSWORT });
    expect(r.statusCode).toBe(200);
    const c = r.cookies.find((k) => k.name === 'lichtung_sitzung')!;
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe('Lax');
    expect(c.path).toBe('/');
    expect(c.maxAge).toBe(365 * 24 * 60 * 60);
    expect(c.secure).toBeFalsy();

    const https = await app.inject({
      method: 'POST',
      url: '/api/anmelden',
      payload: { passwort: PASSWORT },
      headers: { 'content-type': 'application/json', 'x-lichtung': '1', 'x-forwarded-proto': 'https' },
    });
    expect(https.cookies.find((k) => k.name === 'lichtung_sitzung')!.secure).toBe(true);
  });

  it('sperrt nach 5 Fehlversuchen je Adresse', async () => {
    const { app } = await angemeldeteApp();
    for (let i = 0; i < 5; i++) {
      expect((await post(app, '/api/anmelden', { passwort: 'falsch-falsch' }, { ip: '10.0.0.7' })).statusCode).toBe(401);
    }
    const gesperrt = await post(app, '/api/anmelden', { passwort: PASSWORT }, { ip: '10.0.0.7' });
    expect(gesperrt.statusCode).toBe(429);
    expect(gesperrt.json().wartenSekunden).toBeGreaterThan(0);
    expect(gesperrt.json().wartenSekunden).toBeLessThanOrEqual(60);
    // andere Adresse bleibt frei
    expect((await post(app, '/api/anmelden', { passwort: PASSWORT }, { ip: '10.0.0.8' })).statusCode).toBe(200);
  });

  it('meldet ab', async () => {
    const { app, cookie } = await angemeldeteApp();
    expect((await get(app, '/api/spielstand', cookie)).statusCode).toBe(200);
    expect((await post(app, '/api/abmelden', {}, { cookie })).statusCode).toBe(200);
    expect((await get(app, '/api/spielstand', cookie)).statusCode).toBe(401);
  });
});

describe('Schutz der Schnittstelle', () => {
  it('verlangt ein Cookie', async () => {
    const { app } = await angemeldeteApp();
    expect((await get(app, '/api/spielstand')).statusCode).toBe(401);
    expect((await get(app, '/api/sicherungen')).statusCode).toBe(401);
    expect((await post(app, '/api/sicherungen/1/wiederherstellen')).statusCode).toBe(401);
    expect((await get(app, '/api/spielstand', 'lichtung_sitzung=erfunden')).statusCode).toBe(401);
  });

  it('verlangt JSON und den Header X-Lichtung', async () => {
    const { app, cookie } = await angemeldeteApp();
    const ohneHeader = await app.inject({
      method: 'PUT', url: '/api/spielstand', payload: { basis: 0 },
      headers: { 'content-type': 'application/json', cookie },
    });
    expect(ohneHeader.statusCode).toBe(403);
    const ohneJson = await app.inject({
      method: 'POST', url: '/api/anmelden', payload: 'passwort=x',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-lichtung': '1' },
    });
    expect(ohneJson.statusCode).toBe(403);
    const ohneTyp = await app.inject({ method: 'POST', url: '/api/abmelden', headers: { 'x-lichtung': '1' } });
    expect(ohneTyp.statusCode).toBe(403);
  });

  it('meldet den Zustand der Datenbank', async () => {
    const { app, db } = await angemeldeteApp();
    expect((await get(app, '/api/gesund')).json()).toMatchObject({ ok: true, datenbank: true });
    db.close();
    const r = await get(app, '/api/gesund');
    expect(r.statusCode).toBe(503);
    expect(r.json().datenbank).toBe(false);
  });
});

describe('Passwort vergessen', () => {
  it('löscht Passwort und Sitzungen, behält den Spielstand', async () => {
    const { app, db, cookie } = await angemeldeteApp();
    await put(app, '/api/spielstand', { basis: 0, daten: stand(4), geaendert: 1, geraet: 'Laptop' }, cookie);

    const code = passwortZuruecksetzen(db);
    expect(code).toMatch(/^\d{6}$/);
    expect((await get(app, '/api/ich', cookie)).json()).toEqual({ eingerichtet: false, angemeldet: false });
    expect((await post(app, '/api/anmelden', { passwort: PASSWORT })).statusCode).toBe(409);

    const neu = await post(app, '/api/einrichten', { code, passwort: 'ein-neues-passwort' });
    expect(neu.statusCode).toBe(200);
    const geladen = (await get(app, '/api/spielstand', sitzungsCookie(neu))).json();
    expect(geladen.revision).toBe(1);
    expect(geladen.daten.siedlung.tag).toBe(4);
  });
});
