/**
 * Required External Modules
 */

 import express from "express";
 import { Configuration, OpenAIApi } from "openai";
 import bodyParser from "body-parser";
 import fs from "fs";
 import request from "request";
 import dotenv from "dotenv";
 import path from "path";
  import { fileURLToPath } from "url";


// load the environment variables from the .env file
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


/**
 * App Variables
 */

 const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
 const port = process.env.PORT || "8000";

//  allow public access to the public folder
app.use('/static', express.static(path.join(__dirname, 'public')))


/**
 *  App Configuration
 */
 app.set('view engine', 'ejs');


/**
 * Functions
 */
  
var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){    
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};


/**
 * Routes Definitions
 */
// index page
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/image', function(req, res) {
  res.render('image');
});

app.post('/completion', async function(req, res) {

  // get the prompt from the request body
  const prompt = req.body.prompt
  // create an async function to use await
  async function main(prompt) {
    const response = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    console.log(response.data.choices[0].text.trim());
    return response.data.choices[0].text.trim();
  }
  const response = await main(prompt);
  res.json(response);
});


app.post('/generateimage', async function(req, res) {

    // get the prompt from the request body
    const prompt = req.body.prompt
    // create an async function to use await
    async function main(prompt) {
      const response = await openai.createImage({
        prompt: prompt,
        n: 1,
        size: "512x512",
      });
      console.log(response.data.data[0].url);
      return response.data.data[0].url;
    }

    const response = await main(prompt);
    // check if the file exists
    // trim the prompt and remove spaces
    const trimmedPrompt = prompt.trim().replace(/\s/g, '');
    // add time and date to the file name
    var date = new Date();
    var filename = trimmedPrompt +"-"+ date.getTime() + ".png";

    download(response, "public/uploads/" + filename , function(){
      console.log('File creation done');
      // get the path of the file and append the server url
      // getthe current server url
      const serverUrl = req.protocol + '://' + req.get('host');
      var path = serverUrl + "/static/uploads/" + filename;
      console.log(path);
    res.json(response);
});
});

/**
 * Server Activation
 */

 app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
