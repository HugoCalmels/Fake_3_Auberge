import { getFrontendOrigins } from './auth.config';

describe('getFrontendOrigins', () => {
  const original = process.env.FRONTEND_ORIGIN;

  afterEach(() => {
    process.env.FRONTEND_ORIGIN = original;
  });

  it('defaults to localhost', () => {
    delete process.env.FRONTEND_ORIGIN;
    expect(getFrontendOrigins()).toEqual(['http://localhost:3000']);
  });

  it('accepts a single origin', () => {
    process.env.FRONTEND_ORIGIN = 'https://auberge-du-fauxcalm.netlify.app';
    expect(getFrontendOrigins()).toEqual([
      'https://auberge-du-fauxcalm.netlify.app',
    ]);
  });

  it('accepts comma-separated origins, trimmed and without trailing slash', () => {
    process.env.FRONTEND_ORIGIN =
      'https://auberge-du-fauxcalm.netlify.app, https://auberge.hugo-calmels.fr/';
    expect(getFrontendOrigins()).toEqual([
      'https://auberge-du-fauxcalm.netlify.app',
      'https://auberge.hugo-calmels.fr',
    ]);
  });
});
