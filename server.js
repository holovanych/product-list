import express from "express";
import cors from "cors";
import fs from "fs";
import url from "url";
import path from "path";

const PORT = process.env.PORT;
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(__dirname+'/index.html');
});

app.get("/product-filters", (req, res) => {
  fs.readFile(
    __dirname + "/api/" + "products.json",
    "utf8",
    function (err, data) {
      const filters = {
        genre: [],
        yearOfRelease: [],
        platforms: [],
        maxPrice: 0,
      };

      const products = JSON.parse(data);

      products.forEach((product) => {
        const releaseDate = new Date(product.releaseDate);
        const year = releaseDate.getFullYear();

        if (!filters.genre.includes(product.genre)) {
          filters.genre.push(product.genre);
        }

        if (filters.maxPrice <= product.price) filters.maxPrice = product.price;

        filters.yearOfRelease.push(year);
        filters.platforms.push(product.platforms);
      });

      filters.platforms = filters.platforms.flat();
      filters.platforms = [...new Set(filters.platforms)];
      filters.yearOfRelease = [...new Set(filters.yearOfRelease)];
      filters.yearOfRelease.sort((a, b) => b - a);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(filters));
    }
  );
});

app.get("/load-products", (req, res) => {
  fs.readFile(
    __dirname + "/api/" + "products.json",
    "utf8",
    function (err, data) {
      const products = JSON.parse(data);
      const queryParams = req.query;
      console.log(queryParams);
      const filteredProducts = products.filter((product) => {
        let hasGenre = true;
        if (queryParams.genre)
          hasGenre = queryParams.genre.includes(product.genre);
        let hasPlatforms = true;
        if (queryParams.platforms)
          hasPlatforms = queryParams.platforms
            .split(",")
            .some((platform) => product.platforms.includes(platform));
        let hasYear = true;
        if (queryParams.years) {
          const releaseDate = new Date(product.releaseDate);
          const year = releaseDate.getFullYear();
          hasYear = queryParams.years.includes(year);
        }
        let hasMultiplayer = true;
        if(queryParams.multiplayer) {
            hasMultiplayer = queryParams.multiplayer.includes(product.multiplayer)
        }

        let priceInRange = true;
        if(queryParams.priceMin || queryParams.priceMax){
            priceInRange = (parseFloat(queryParams.priceMin) <= product.price && product.price <= parseFloat(queryParams.priceMax))
            console.log(parseFloat(queryParams.priceMin), product.price, parseFloat(queryParams.priceMax),priceInRange)
        }

        return hasGenre && hasPlatforms && hasYear && hasMultiplayer && priceInRange;
      });

      /*filteredProducts.sort(( a, b ) => {
        return a[queryParams.sortBy] - b[queryParams.sortBy]; 
      });*/

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(filteredProducts));
    }
  );
});

app.listen(PORT, () => console.log("Listening"));
