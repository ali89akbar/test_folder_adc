import { describe, it, expect } from 'vitest';
import {
  today,
  ckp,
  ckCat,
  ckCatSite,
  fmt,
  fmtDate,
  fmtTime,
  addDays,
  daysBetween,
  norm,
} from '../../../src/utils/helper.js';

describe('Helper Utility Functions', () => {
  it('today returns current date in YYYY-MM-DD format', () => {
    const res = today();
    expect(res).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ckp builds 5-part category composite key', () => {
    const key = ckp('Visa', 'Gold', 'Debit', 'Classic', 'PLASTIC');
    expect(key).toBe('PLASTIC|Visa|Gold|Debit|Classic');
  });

  it('ckCat builds 4-part category key', () => {
    const key = ckCat('Mastercard', 'Standard', 'Credit', 'PLASTIC');
    expect(key).toBe('PLASTIC|Mastercard|Standard|Credit');
  });

  it('ckCatSite builds site-prefixed category key', () => {
    const key = ckCatSite('Visa', 'Classic', 'Standard', 'PLASTIC', 'KHI');
    expect(key).toBe('KHI|PLASTIC|Visa|Classic|Standard');
  });

  it('fmt formats numbers with locale commas', () => {
    expect(fmt(1000)).toBe('1,000');
    expect(fmt(1234567)).toBe('1,234,567');
    expect(fmt(0)).toBe('0');
    expect(fmt(null)).toBe('0');
  });

  it('fmtDate converts ISO/date string to DD-MMM-YYYY format', () => {
    expect(fmtDate('2026-10-31')).toBe('31-Oct-2026');
    expect(fmtDate('2026-01-05')).toBe('05-Jan-2026');
    expect(fmtDate('')).toBe('—');
    expect(fmtDate(null)).toBe('—');
  });

  it('fmtTime formats ISO string into readable date/time', () => {
    const formatted = fmtTime('2026-10-31T10:30:00Z');
    expect(formatted).toBeTruthy();
    expect(fmtTime('invalid')).toBe('Invalid Date');
  });

  it('addDays correctly offsets dates by N days', () => {
    expect(addDays('2026-10-10', 5)).toBe('2026-10-15');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('daysBetween computes day difference between two dates', () => {
    expect(daysBetween('2026-10-01', '2026-10-11')).toBe(10);
    expect(daysBetween('2026-10-10', '2026-10-05')).toBe(-5);
  });

  it('norm normalizes and trims uppercase whitespace', () => {
    expect(norm('  visa   gold  ')).toBe('VISA GOLD');
  });
});
