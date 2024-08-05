import ProductsServices from "./products-services.js";

class EditProductForm {
  constructor() {
    this.productsServices = new ProductsServices();
    this.id = this.getIDfromURL();
    this.product = this.productsServices.getProductByID(this.id);
  }

  getIDfromURL() {
    const url = window.location.href;
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get("id");
    return parseInt(id);
  }

  async fillForm() {
    const product = await this.product;
    const productIdInput = document.querySelector('#product-id');
    const title = document.querySelector('input[name="title"]');
    const genre = document.querySelector('input[name="genre"]');
    const price = document.querySelector('input[name="price"]');
    const releaseDate = document.querySelector('input[name="releaseDate"]');
    const coverImage = document.querySelector('.cover-image');
    const platforms = document.querySelector('textarea[name="platforms"]');
    const rating = document.querySelector('input[name="rating"]');
    const multTrue = document.querySelector('.field-mult-wrapper input[value="true"]');
    const multFalse = document.querySelector('.field-mult-wrapper input[value="false"]');
    /* Set Values */
    productIdInput.value = product.id;
    title.value = product.title;
    genre.value = product.genre;
    price.value = product.price;
    releaseDate.value = this.formatDateToString(product.releaseDate);
    platforms.value = product.platforms.join(', ');
    description.value = product.description;
    coverImage.setAttribute('src', product.gameCoverImage)
    rating.value = product.rating;
    console.log(product.multiplayer)
    if(product.multiplayer === true){
        multTrue.checked = true;
    } else if(product.multiplayer === false) {
        multFalse.checked = true;
    }
  }

  formatDateToString(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

const form = new EditProductForm();
form.fillForm();

