import { describe, it, expect } from 'vitest';
import { wma, buildForecast } from '../../../src/utils/forecast.jsx';

describe('Forecasting Engine (forecast.jsx)', () => {
  describe('wma (Weighted Moving Average)', () => {
    it('returns 0 for empty array', () => {
      expect(wma([])).toBe(0);
    });

    it('calculates weighted moving average with linearly increasing weights', () => {
      // weights: 1, 2. values: 10, 20. (10*1 + 20*2) / (1 + 2) = 50 / 3 = 16.666...
      const result = wma([10, 20]);
      expect(result).toBeCloseTo(16.67, 1);
    });

    it('returns correct value when all numbers are identical', () => {
      expect(wma([50, 50, 50])).toBe(50);
    });
  });

  describe('buildForecast', () => {
    it('returns empty array when no entries provided', () => {
      const results = buildForecast([], {});
      expect(results).toEqual([]);
    });

    it('correctly calculates burn rate and status for items', () => {
      const entries = [
        {
          date: '2026-10-25',
          site: 'KHI',
          invType: 'PLASTIC',
          cardType: 'Visa Classic',
          scheme: 'VISA',
          plasticCategory: 'Standard',
          subProduct: 'Debit EMV',
          segment: 'ETB',
          totalConsumption: 50,
        },
        {
          date: '2026-10-26',
          site: 'KHI',
          invType: 'PLASTIC',
          cardType: 'Visa Classic',
          scheme: 'VISA',
          plasticCategory: 'Standard',
          subProduct: 'Debit EMV',
          segment: 'ETB',
          totalConsumption: 50,
        },
      ];

      const closing = {
        'KHI|PLASTIC|Visa Classic|VISA|Standard': { value: 100 },
        'LHE|PLASTIC|Visa Classic|VISA|Standard': { value: 0 },
      };

      const forecast = buildForecast(entries, closing, {}, 'KHI');

      expect(forecast.length).toBe(1);
      const item = forecast[0];
      expect(item.cardType).toBe('Visa Classic');
      expect(item.stock).toBe(100);
      expect(item.primary).toBeGreaterThan(0);
      expect(item.daysLeft).toBeDefined();
    });

    it('filters entries strictly by selected site when siteFilter is specified', () => {
      const entries = [
        { date: '2026-10-25', site: 'KHI', invType: 'PLASTIC', cardType: 'Debit', scheme: 'VISA', plasticCategory: 'Standard', totalConsumption: 100 },
        { date: '2026-10-25', site: 'LHE', invType: 'PLASTIC', cardType: 'Debit', scheme: 'VISA', plasticCategory: 'Standard', totalConsumption: 500 },
      ];
      const closing = {
        'KHI|PLASTIC|Debit|VISA|Standard': { value: 200 },
        'LHE|PLASTIC|Debit|VISA|Standard': { value: 1000 },
      };

      const khiForecast = buildForecast(entries, closing, {}, 'KHI');
      expect(khiForecast[0].stock).toBe(200);
    });
  });
});
