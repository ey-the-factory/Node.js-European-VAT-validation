"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const port = process.env.PORT || 8080;
const path = require("path");
const favicon = require("serve-favicon");
const app = express();
const countries = require("./lib/eu-countries");
const endpoint =
  "http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl";
const soap = require("soap");
const cors = require("cors");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({ vatNumbers: [] }).write();

app.disable("x-powered-by");

app.set("view engine", "ejs");
app.set("env", "development");

app.use(
  cors({
    credentials: true,
    // TODO Move to env variable
    origin: ["https://sites.ey.com", "http://localhost:3000"],
  })
);

app.use(favicon(path.join(__dirname, "favicon.png")));

app.use(
  "/public",
  express.static(path.join(__dirname, "/public"), {
    maxAge: 0,
    dotfiles: "ignore",
    etag: false,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("index", { countries: countries });
});

app.post("/validate", (req, res) => {
  let country = req.body.country;
  let vat = req.body.vat;
  let params = {
    countryCode: country,
    vatNumber: vat,
  };
  const id = `${country}${vat}`;
  const cachedItem = db.get("vatNumbers").find({ id }).value();
  if (cachedItem) {
    return res.send(cachedItem.result);
  }
  soap.createClient(endpoint, (err, client) => {
    client.checkVat(params, (err, result) => {
      // Add a post
      db.get("vatNumbers")
        .push({
          id,
          result,
        })
        .write();
      res.send(result);
    });
  });
});

if (app.get("env") === "development") {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
  });
}

app.use((err, req, res, next) => {
  res.status(err.status || 500);
});

app.listen(port);
