import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import url from "url";
import path from "path";

const PORT = 8000;
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/product-by-id", (req, res) => {
  const id = parseInt(req.query.id);
  fs.readFile(
    __dirname + "/api/" + "products.json",
    "utf8",
    function (err, data) {
      const products = JSON.parse(data);
      const findedProduct = products.find((product) => product.id === id);

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(findedProduct));
    }
  );
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
        if (queryParams.multiplayer) {
          hasMultiplayer = queryParams.multiplayer.includes(
            product.multiplayer
          );
        }

        let priceInRange = true;
        if (queryParams.priceMin || queryParams.priceMax) {
          priceInRange =
            parseFloat(queryParams.priceMin) <= product.price &&
            product.price <= parseFloat(queryParams.priceMax);
        }

        return (
          hasGenre && hasPlatforms && hasYear && hasMultiplayer && priceInRange
        );
      });

      if (queryParams.sortBy === "price") {
        filteredProducts.sort((a, b) => {
          if (queryParams.sortOrder === "ASC") {
            return a.price - b.price;
          } else if (queryParams.sortOrder === "DESC") {
            return b.price - a.price;
          }
        });
      }

      if (queryParams.sortBy === "rating") {
        filteredProducts.sort((a, b) => {
          if (queryParams.sortOrder === "ASC") {
            return a.rating - b.rating;
          } else if (queryParams.sortOrder === "DESC") {
            return b.rating - a.rating;
          }
        });
      }

      if (queryParams.sortBy === "releaseDate") {
        filteredProducts.sort((a, b) => {
          const dateA = new Date(a.releaseDate);
          const dateB = new Date(b.releaseDate);

          if (queryParams.sortOrder === "DESC") {
            return dateA - dateB;
          } else if (queryParams.sortOrder === "ASC") {
            return dateB - dateA;
          }
        });
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(filteredProducts));
    }
  );
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/products/"); // Specify your upload directory
  },
  filename: function (req, file, cb) {
    function convertToSlug(Text) {
      return Text.toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");
    }
    // Use req.body.title as the filename, and preserve the original extension
    const ext = path.extname(file.originalname);
    const filename = convertToSlug(req.body.title) + ext;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

app.post("/add-product", upload.single("gameCoverImage"), (req, res) => {
  fs.readFile(
    __dirname + "/api/" + "products.json",
    "utf8",
    function (err, data) {
      data = JSON.parse(data);
      const newProduct = {
        id: generateUniqueId(),
        title: req.body.title,
        genre: req.body.genre,
        price: parseFloat(req.body.price),
        releaseDate: formatDateString(req.body.releaseDate),
        gameCoverImage: req.file.path.replace(/\\/g, "/"),
        platforms: req.body.platforms.split(",").map(platform => platform.trim()),
        description: req.body.description,
        multiplayer: stringToBoolean(req.body.multiplayer),
        rating: parseFloat(req.body.rating),
      };
      data.push(newProduct);
      fs.writeFile(
        __dirname + "/api/products.json",
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) {
            return res.status(500).send("Error writing products file.");
          }
          res.setHeader("Content-Type", "text/html");
          res.end(`<h1>New Product ${req.body.title} Created!</h1> <a href="${req.headers.origin}">Back To home Page</a>`);
        }
      );
    }
  );
});

/* EDIT PRODUCT */

app.post("/edit-product", upload.single("gameCoverImage"), (req, res) => {
  fs.readFile(
    __dirname + "/api/" + "products.json",
    "utf8",
    function (err, data) {
      const productId = parseInt(req.body.productId);
      data = JSON.parse(data);
      const findedProductIndex = data.findIndex((product) => {
        return product.id === productId;
      });
      const editedProduct = {
        id: productId,
        title: req.body.title,
        genre: req.body.genre,
        price: parseFloat(req.body.price),
        releaseDate: formatDateString(req.body.releaseDate),
        gameCoverImage: req.file
          ? req.file.path.replace(/\\/g, "/")
          : data[findedProductIndex].gameCoverImage,
        platforms: req.body.platforms.split(",").map(platform => platform.trim()),
        description: req.body.description,
        multiplayer: stringToBoolean(req.body.multiplayer),
        rating: parseFloat(req.body.rating),
      };

      data.splice(findedProductIndex, 1, editedProduct);

      fs.writeFile(
        __dirname + "/api/products.json",
        JSON.stringify(data, null, 2),
        (err) => {
          if (err) {
            return res.status(500).send("Error writing products file.");
          }

           res.setHeader("Content-Type", "text/html");
           res.end(`<h1>Product ${req.body.title} Edited !</h1> <a href="${req.headers.origin}">Back To home Page</a>`);
        }
      );
    }
  );
});

/*  END EDIT PRODUCT */

app.delete("/delete-product", function (req, res) {
  const id = parseInt(req.query.id);
  fs.readFile(
    __dirname + "/api/" + "products.json",
    "utf8",
    function (err, data) {
      data = JSON.parse(data);
      const productIndex = data.findIndex((product) => product.id === id);
      data.splice(productIndex, 1);
      // Write the updated products array back to the JSON file
      fs.writeFile(
        __dirname + "/api/products.json",
        JSON.stringify(data, null, 2),
        () => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ deleted: "success" }));
        }
      );
    }
  );
});

app.listen(PORT, () => console.log("Listening"));

function formatDateString(dateString) {
  const date = new Date(dateString);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function stringToBoolean(str) {
  return str.toLowerCase() === "true";
}

function generateUniqueId() {
  return Math.floor(Math.random() * 1000000000000);
}
