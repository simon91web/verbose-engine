import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { oeffneDatenbank } from '../src/datenbank.ts';
import { legeSicherungAb, nachtsicherung } from '../src/spielstand.ts';
import { angemeldeteApp, get, post, put, stand } from './hilfen.ts';

const sichern = (app: Parameters<typeof put>[0], cookie: string, basis: number, tag: number, geraet = 'Laptop', geaendert = tag * 1000) =>
  put(app, '/api/spielstand', { basis, daten: stand(tag), geaendert, geraet }, cookie);

describe('Spielstand', () => {
  it('ist am Anfang leer', async () => {
    const { app, cookie } = await angemeldeteApp();
    expect((await get(app, '/api/spielstand', cookie)).json()).toEqual({ revision: 0, daten: null });
  });

  it('zählt die Revision hoch', async () => {
    const { app, cookie } = await angemeldeteApp();
    expect((await sichern(app, cookie, 0, 1)).json()).toEqual({ revision: 1 });
    expect((await sichern(app, cookie, 1, 2)).json()).toEqual({ revision: 2 });
    expect((await get(app, '/api/spielstand', cookie)).json()).toEqual({
      revision: 2, daten: stand(2), geaendert: 2000, geraet: 'Laptop',
    });
  });

  it('antwortet bei veralteter Basis mit 409 und dem Serverstand', async () => {
    const { app, cookie } = await angemeldeteApp();
    await sichern(app, cookie, 0, 1);
    await sichern(app, cookie, 1, 2);
    const r = await sichern(app, cookie, 1, 9, 'Handy');
    expect(r.statusCode).toBe(409);
    expect(r.json()).toMatchObject({ revision: 2, daten: stand(2), geraet: 'Laptop' });
    // nichts überschrieben
    expect((await get(app, '/api/spielstand', cookie)).json().daten).toEqual(stand(2));
  });

  it('prüft grob', async () => {
    const { app, cookie } = await angemeldeteApp();
    const koerper = (daten: unknown) => ({ basis: 0, daten, geaendert: 1, geraet: 'x' });
    expect((await put(app, '/api/spielstand', koerper(null), cookie)).statusCode).toBe(400);
    expect((await put(app, '/api/spielstand', koerper([1]), cookie)).statusCode).toBe(400);
    expect((await put(app, '/api/spielstand', koerper({ a: 1 }), cookie)).statusCode).toBe(400);
    expect((await put(app, '/api/spielstand', koerper({ version: 3, platz: 'x'.repeat(1024 * 1024) }), cookie)).statusCode).toBe(400);
    expect((await put(app, '/api/spielstand', { daten: stand(1), geaendert: 1 }, cookie)).statusCode).toBe(400);
  });
});

describe('Sicherungen', () => {
  it('erzwingen legt den bisherigen Stand als Sicherung ab', async () => {
    const { app, cookie } = await angemeldeteApp();
    await sichern(app, cookie, 0, 5, 'Handy');
    const r = await put(
      app, '/api/spielstand?erzwingen=1',
      { daten: stand(9), geaendert: 9000, geraet: 'Laptop', grund: 'Vom Handy überholt' }, cookie,
    );
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ revision: 2 });
    const liste = (await get(app, '/api/sicherungen', cookie)).json();
    expect(liste).toEqual([{ id: 1, zeitpunkt: 5000, grund: 'Vom Handy überholt', geraet: 'Handy', tag: 5 }]);
    expect((await get(app, '/api/spielstand', cookie)).json().daten).toEqual(stand(9));
  });

  it('erzwingen ohne bisherigen Stand legt keine Sicherung an', async () => {
    const { app, cookie } = await angemeldeteApp();
    const r = await put(app, '/api/spielstand?erzwingen=1', { daten: stand(1), geaendert: 1, geraet: 'x' }, cookie);
    expect(r.json()).toEqual({ revision: 1 });
    expect((await get(app, '/api/sicherungen', cookie)).json()).toEqual([]);
  });

  it('legt nur eine Sicherung an, ohne den Stand zu ändern', async () => {
    const { app, cookie } = await angemeldeteApp();
    await sichern(app, cookie, 0, 4, 'Laptop');
    const r = await post(app, '/api/sicherungen', { daten: stand(2), geaendert: 2000, geraet: 'Handy', grund: 'Vom Laptop überholt' }, { cookie });
    expect(r.json()).toEqual({ ok: true });
    expect((await get(app, '/api/sicherungen', cookie)).json()).toEqual([
      { id: 1, zeitpunkt: 2000, grund: 'Vom Laptop überholt', geraet: 'Handy', tag: 2 },
    ]);
    expect((await get(app, '/api/spielstand', cookie)).json()).toMatchObject({ revision: 1, daten: stand(4) });
    expect((await post(app, '/api/sicherungen', { daten: 'kaputt', geaendert: 1, geraet: 'x' }, { cookie })).statusCode).toBe(400);
  });

  it('stellt wieder her und sichert den aktuellen Stand', async () => {
    const { app, cookie } = await angemeldeteApp();
    await sichern(app, cookie, 0, 3, 'Handy');
    await put(app, '/api/spielstand?erzwingen=1', { daten: stand(8), geaendert: 8000, geraet: 'Laptop', grund: 'Überholt' }, cookie);
    const r = await post(app, '/api/sicherungen/1/wiederherstellen', {}, { cookie });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ revision: 3, daten: stand(3), geraet: 'Handy' });
    const liste = (await get(app, '/api/sicherungen', cookie)).json();
    expect(liste.map((s: { grund: string; tag: number }) => [s.grund, s.tag])).toEqual([
      ['Vor Wiederherstellen', 8],
      ['Überholt', 3],
    ]);
    expect((await post(app, '/api/sicherungen/99/wiederherstellen', {}, { cookie })).statusCode).toBe(404);
  });

  it('behält höchstens 50, Nachtsicherungen ausgenommen', async () => {
    const { app, db, cookie } = await angemeldeteApp();
    const daten = (n: number) => JSON.stringify(stand(n));
    legeSicherungAb(db, 1, { zeitpunkt: 1, grund: 'Nachtsicherung', geraet: '', daten: daten(0) });
    for (let i = 1; i <= 55; i++) legeSicherungAb(db, 1, { zeitpunkt: i, grund: 'Überholt', geraet: '', daten: daten(i) });
    const liste = (await get(app, '/api/sicherungen', cookie)).json() as { grund: string; tag: number }[];
    expect(liste.filter((s) => s.grund === 'Überholt')).toHaveLength(50);
    expect(liste.filter((s) => s.grund === 'Nachtsicherung')).toHaveLength(1);
    // die ältesten fielen weg
    expect(Math.min(...liste.filter((s) => s.grund === 'Überholt').map((s) => s.tag))).toBe(6);
  });
});

describe('Nachtsicherung', () => {
  const ordner: string[] = [];
  afterEach(() => {
    for (const o of ordner.splice(0)) rmSync(o, { recursive: true, force: true });
  });
  const temp = () => {
    const o = mkdtempSync(join(tmpdir(), 'lichtung-test-'));
    ordner.push(o);
    return o;
  };

  it('behält die letzten 7 Dateien und sichert nur einmal je Tag', async () => {
    const verz = temp();
    const db = oeffneDatenbank(join(verz, 'lichtung.db'));
    const sicherungen = join(verz, 'sicherungen');
    // zehn alte Tage und eine fremde Datei
    for (let t = 1; t <= 10; t++) {
      expect(nachtsicherung(db, sicherungen, new Date(2026, 0, t, 3))).toBe(true);
    }
    writeFileSync(join(sicherungen, 'notiz.txt'), 'bleibt');
    const dateien = readdirSync(sicherungen).filter((n) => n.endsWith('.db')).sort();
    expect(dateien).toEqual(['04', '05', '06', '07', '08', '09', '10'].map((t) => `lichtung-2026-01-${t}.db`));
    expect(existsSync(join(sicherungen, 'notiz.txt'))).toBe(true);
    expect(nachtsicherung(db, sicherungen, new Date(2026, 0, 10, 23))).toBe(false);
    db.close();
  });

  it('legt eine Zeile nur an, wenn sich der Stand geändert hat', async () => {
    const { app, db, cookie } = await angemeldeteApp();
    const verz = temp();
    const zeilen = () => (db.prepare("SELECT COUNT(*) AS n FROM sicherung WHERE grund = 'Nachtsicherung'").get() as { n: number }).n;

    nachtsicherung(db, verz, new Date(2026, 5, 1));
    expect(zeilen()).toBe(0); // noch kein Stand
    await sichern(app, cookie, 0, 1);
    nachtsicherung(db, verz, new Date(2026, 5, 2));
    expect(zeilen()).toBe(1);
    nachtsicherung(db, verz, new Date(2026, 5, 3));
    expect(zeilen()).toBe(1); // unverändert
    await sichern(app, cookie, 1, 2);
    nachtsicherung(db, verz, new Date(2026, 5, 4));
    expect(zeilen()).toBe(2);
  });
});
