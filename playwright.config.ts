import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv'

config({ path: '.env.local' })

const URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 200000,
  use: {
    baseURL: URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          ],
          ignoreDefaultArgs: ['--enable-automation'],
          headless: false
        },
        contextOptions: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          locale: 'zh-CN',
          timezoneId: 'Asia/Shanghai',
          permissions: ['geolocation'],
          geolocation: { longitude: 116.404, latitude: 39.915 },
        }
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: URL,
    reuseExistingServer: !process.env.CI,
  },
});
