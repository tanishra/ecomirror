import { calculateFootprint, contextualizeFootprint, sendChatMessage, cancelChatStream } from '../api';

global.fetch = jest.fn();

describe('calculateFootprint', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('returns JSON on successful response', async () => {
    const mockData = { total_co2_kg_per_year: 1000, score: 50 };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await calculateFootprint({ transport_km_per_day: 10 });
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/calculate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws on non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => 'Validation error',
    });

    await expect(calculateFootprint({})).rejects.toThrow('Validation error');
  });

  it('throws default message when response text is empty', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    });

    await expect(calculateFootprint({})).rejects.toThrow('Calculation failed');
  });
});

describe('contextualizeFootprint', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('returns JSON on successful response', async () => {
    const mockData = { analogies: ['test'], nudges: [] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await contextualizeFootprint({ score: 50 }, { diet_type: 'veg' });
    expect(result).toEqual(mockData);
  });

  it('throws on non-ok response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    });

    await expect(contextualizeFootprint({}, {})).rejects.toThrow('Server error');
  });
});

describe('cancelChatStream', () => {
  it('does not throw when no active stream', () => {
    expect(() => cancelChatStream()).not.toThrow();
  });
});
