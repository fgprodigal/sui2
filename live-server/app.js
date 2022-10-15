const express = require('express')
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser');

const app = express()
const port = 3000

// place to build sui2
buildDir = path.resolve(__dirname, '..')
distDir = path.resolve(buildDir, 'dist')
console.log('buildDir', buildDir)

// place to get frontend resources
frontendDir = path.resolve(__dirname, 'frontend/dist')

// place to store data generated by live-server
dataDir = process.env.DATA_DIR || 'data'
if (!path.isAbsolute(dataDir)) {
  path.resolve(dataDir)
}
dataFilePath = path.resolve(dataDir, 'data.json')
console.log('dataFilePath', dataFilePath)

// start up check

if (!fs.existsSync(dataFilePath)) {
  console.log('copy example file to DATA_DIR')
  fs.copyFileSync(path.resolve(buildDir, 'data.example.json'), dataFilePath)
}

// server code

app.use(bodyParser.text({type: 'text/plain'}))

app.get('/api/getData', (req, res) => {
  const data = fs.readFileSync(dataFilePath)
  res.setHeader('Content-Type', 'application/json')
  res.send(data)
})

app.post('/api/updateDataFile', (req, res) => {
  rawBody = req.body
  try {
    JSON.parse(rawBody)
  } catch(e) {
    console.log('rawBody')
    console.log(rawBody)
    res.status(400).send(`JSON parse error: ${e}`)
    return
  }

  // save to data dir
  fs.writeFileSync(dataFilePath, rawBody)
  res.send(JSON.stringify({ok: 1}))
})

app.post('/api/build', (req, res) => {
  const cmd = 'npm run build'
  const newEnv = {
    ...process.env,
    DATA_FILE: dataFilePath,
    NO_PWA: 1,
  }
  exec(cmd, {
    'cwd': buildDir,
    'env': newEnv,
  }, (err, stdout, stderr) => {
    if (err) {
      const errMsg = `Error: ${err}`
      console.log(errMsg);
      res.status(500).send(errMsg);
      return;
    }
    console.log(`* exec: ${cmd}`);
    console.log(stdout);
    res.send(`Success
stdout: ${stdout}
stderr: ${stderr}`);
  })
})

app.use('/', express.static(frontendDir))

app.use('/preview', express.static(distDir))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
