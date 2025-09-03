import { test, expect } from '@playwright/test'

test.describe('登录测试', () => {
  test('密码登录', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL('**/meetchances-talent.authing.cn/**')

    // 等待密码登录文案出现
    await expect(page.getByText('密码登录')).toBeVisible();

    await page.getByText('密码登录').click()

    await page.locator('#passworLogin_account').fill(process.env.E2E_MOBILE_NUMBER!)
    await page.locator('#passworLogin_password').fill(process.env.E2E_PASSWORD!)
    await page.locator('.authing-ant-checkbox-input').click()
    await page.getByText('登录 / 注册').click()

    await page.waitForURL('**/jobs')

    await expect(page.getByRole('heading', { name: '职位列表' })).toBeVisible();
  })
})