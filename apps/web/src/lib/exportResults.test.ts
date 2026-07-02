import { describe, expect, it } from 'vitest';
import {
  formatResultsAsCsv,
  formatResultsAsExcelXml,
  formatResultsAsJson,
} from './exportResults';

const sampleResult = {
  columns: ['id', 'name', 'note'],
  rows: [
    [1, 'Ada', '<script>'],
    [2, 'Grace', null],
  ],
  rowCount: 2,
  durationMs: 1.2,
};

describe('formatResultsAsCsv', () => {
  it('escapes quotes in csv cells', () => {
    const csv = formatResultsAsCsv({
      ...sampleResult,
      columns: ['msg'],
      rows: [['say "hi"']],
    });

    expect(csv).toContain('"say ""hi"""');
  });
});

describe('formatResultsAsExcelXml', () => {
  it('includes headers and rows', () => {
    const xml = formatResultsAsExcelXml(sampleResult);

    expect(xml).toContain('<Data ss:Type="String">id</Data>');
    expect(xml).toContain('<Data ss:Type="String">Ada</Data>');
    expect(xml).toContain('<Data ss:Type="Number">1</Data>');
  });

  it('escapes xml in cell values', () => {
    const xml = formatResultsAsExcelXml(sampleResult);

    expect(xml).toContain('&lt;script&gt;');
    expect(xml).not.toContain('<script>');
  });

  it('renders null cells as empty', () => {
    const xml = formatResultsAsExcelXml(sampleResult);

    expect(xml).toContain('<Cell/>');
  });
});

describe('formatResultsAsJson', () => {
  it('maps columns to row objects', () => {
    const json = formatResultsAsJson(sampleResult);
    const parsed = JSON.parse(json) as Array<Record<string, unknown>>;

    expect(parsed[0]).toEqual({ id: 1, name: 'Ada', note: '<script>' });
    expect(parsed[1]?.note).toBeNull();
  });
});
