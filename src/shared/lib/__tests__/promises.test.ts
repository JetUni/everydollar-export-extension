import delay from '@root/src/shared/lib/delay';
import { withRateLimit } from '@root/src/shared/lib/promises';

describe('withRateLimit', () => {
  it('spaces out requests', async () => {
    const request = async () => {
      await delay(100);
      console.log(new Date().getTime());
    };

    const startTime = new Date().getTime();
    await withRateLimit({ delayMs: 500 })([request, request, request]);
    const endTime = new Date().getTime();

    expect(endTime - startTime).toBeGreaterThan(1000);
  });
});
