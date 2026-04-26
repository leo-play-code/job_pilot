import puppeteer from 'puppeteer'

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-TW,zh;q=0.9' })
  await page.setViewport({ width: 1280, height: 800 })

  console.log('>>> Navigating to login.104.com.tw/login ...')
  await page.goto('https://login.104.com.tw/login', { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2000))
  console.log(`  URL: ${page.url()}`)

  // Fill identity with a dummy email, then click 下一步 to reveal password field
  await page.waitForSelector('#identity', { timeout: 10000 })
  await page.click('#identity', { clickCount: 3 })
  await page.type('#identity', 'test@test.com', { delay: 50 })
  console.log('  Typed dummy email into #identity')

  // Click 下一步
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const next = btns.find(b => b.innerText?.trim() === '下一步')
    next?.click()
  })
  console.log('  Clicked 下一步')
  await new Promise(r => setTimeout(r, 3000))
  console.log(`  URL after 下一步: ${page.url()}`)

  // Capture all inputs after clicking 下一步
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(el => ({
      id: el.id, name: el.name, type: el.type, placeholder: el.placeholder,
      visible: el.offsetWidth > 0 && el.offsetHeight > 0,
      outerHTML: el.outerHTML.slice(0, 300),
    }))
  )
  console.log(`\n  Inputs after 下一步 (${inputs.length}):`)
  inputs.forEach((el, i) => console.log(`  [${i}] id="${el.id}" name="${el.name}" type="${el.type}" placeholder="${el.placeholder}" visible=${el.visible}\n    ${el.outerHTML}`))

  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(el => ({
      type: el.type, text: el.innerText?.trim(),
    })).filter(b => b.text)
  )
  console.log(`\n  Buttons after 下一步 (${buttons.length}):`)
  buttons.forEach((el, i) => console.log(`  [${i}] type="${el.type}" text="${el.text}"`))

  // Also dump the page body to see full structure
  const html = await page.evaluate(() => document.body.innerHTML)
  console.log('\n  Page body HTML (first 5000 chars):')
  console.log(html.slice(0, 5000))

  await browser.close()
  console.log('\n>>> Done.')
}

main().catch(console.error)
