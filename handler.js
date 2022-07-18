const chromium = require('chrome-aws-lambda');
const playwright = require('playwright-core');
const fs = require('fs');

const serverless = require("serverless-http");
const express = require("express");
var cors = require('cors')

const app = express();
app.use(cors());

app.get("/", async function (req, res) {
  let browser = null;
  var resp = {}
  try {
    const browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    let page = await browser.newPage();
    if(!req.query?.url)
      throw Error("Url not present in query")
    await page.goto(req.query.url);
    
    // This make sures it renders pdf properly0
    await page.emulateMedia({ media: 'screen' });

    const templateHeader = fs.readFileSync(
      'header.html',
      'utf-8'
    );
    const templateFooter = fs.readFileSync(
      'footer.html',
      'utf-8'
    );

    const binData = await page.pdf({
      displayHeaderFooter: true,
      headerTemplate: templateHeader,
      footerTemplate: templateFooter,
      margin: {
        top: '16px',
        bottom: '36px',
      },
      printBackground: true,
    });
    console.log('Pdf size', binData?.length);
    // convert binary data to base64 encoded string
    const data = Buffer.from(binData).toString('base64');

    resp = res.status(200).json({
      data: data
    })
  } catch (error) {
    resp = res.status(400).json({
      error: error
    })
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  return resp;
});

module.exports.handler = serverless(app);
