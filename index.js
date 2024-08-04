import ProductsServices from "./products-services.js";

class ProductList {
  constructor() {
    this.productsServices = new ProductsServices();
    this.pageParams = this.getPageParams();
  }

  async renderFilters() {
    const filters = await this.productsServices.filters;
    /* Render Genre Filters */
    const filterGenreBox = document.querySelector(
      ".filter-genre .filter-fieldset__wrapper"
    );
    let genreElementsRow = ``;
    filters.genre.forEach((genre) => {
      const isChecked = this.pageParams.genre.includes(genre)
        ? " checked "
        : "";
      genreElementsRow += `
                    <div class="filter-fieldset__item">
                        <input type="checkbox" id="${genre}" value="${genre}" name="genre" class="filter-fieldset__checkbox" ${isChecked} />
                        <label for="${genre}" class="filter-fieldset__label">${genre}</label>
                    </div>
                `;
    });

    filterGenreBox.innerHTML = genreElementsRow;

    /* Render Platforms Filters */
    const filterPlatformBox = document.querySelector(
      ".filter-platform .filter-fieldset__wrapper"
    );
    let filterElementsRow = ``;
    filters.platforms.forEach((platform) => {
      const isChecked = this.pageParams.platforms.includes(platform)
        ? " checked "
        : "";
      filterElementsRow += `
                    <div class="filter-fieldset__item">
                        <input type="checkbox" id="${platform}" value="${platform}" name="platform" class="filter-fieldset__checkbox"  ${isChecked} />
                        <label for="${platform}" class="filter-fieldset__label">${platform}</label>
                    </div>`;
    });
    filterPlatformBox.innerHTML = filterElementsRow;

    /* Render Years Filters */
    const filterYearBox = document.querySelector(
      ".filter-year .filter-fieldset__wrapper"
    );
    let yearsElementRow = ``;
    filters.yearOfRelease.forEach((year) => {
      const isChecked = this.pageParams.years.includes(year) ? " checked " : "";
      yearsElementRow += `
                    <div class="filter-fieldset__item">
                        <input type="checkbox" id="${year}" value="${year}" name="year" class="filter-fieldset__checkbox" ${isChecked} />
                        <label for="${year}" class="filter-fieldset__label">${year}</label>
                    </div>`;
    });
    filterYearBox.innerHTML = yearsElementRow;

    /* Multiplayer Filters */
    Array.from(
      document.querySelectorAll(
        ".filter-multiplayer .filter-fieldset__checkbox"
      )
    ).forEach((checkbox) => {
      const isChecked = this.pageParams.multiplayer.includes(
        checkbox.getAttribute("value")
      );

      checkbox.checked = isChecked;
    });

    /* Render Price */
    const maxPriceInput = document.querySelector(".filter-price .max-price");
    const minPriceInput = document.querySelector(".filter-price .min-price");
    maxPriceInput.setAttribute("placeholder", filters.maxPrice);
    maxPriceInput.setAttribute("max", filters.maxPrice);

    if (isNaN(this.pageParams.priceMax) || this.pageParams.priceMax === 0) {
      this.pageParams.priceMax = filters.maxPrice;
      maxPriceInput.value = "";
    } else {
      maxPriceInput.value = this.pageParams.priceMax;
      if (this.pageParams.priceMax === filters.maxPrice) {
        maxPriceInput.value = "";
      }
    }

    minPriceInput.value = this.pageParams.priceMin || "";

    /* Sort By */
    document.querySelector(".products-sort .select-product").value =
      this.pageParams.sortBy;
    const sortASC = document.querySelector(".sort-asc");
    const sortDESC = document.querySelector(".sort-desc");

    if (this.pageParams.sortOrder === "ASC") {
      sortASC.classList.add("active");
      sortDESC.classList.remove("active");
    } else if (this.pageParams.sortOrder === "DESC") {
      sortDESC.classList.add("active");
      sortASC.classList.remove("active");
    }
  }

  getPageParams() {
    if (!localStorage.pageParams) {
      return {
        sortBy: "releaseDate",
        sortOrder: "ASC",
        genre: [],
        platforms: [],
        years: [],
        multiplayer: [],
        priceMin: 0,
        priceMax: 0,
      };
    }
    return JSON.parse(localStorage.pageParams);
  }

  savePageParams() {
    localStorage.setItem("pageParams", JSON.stringify(this.pageParams));
  }

  addEventsToFilters() {
    const getActiveCheckboxes = (selector, type) =>
      Array.from(document.querySelectorAll(selector))
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => {
          if (type === "number") {
            return parseInt(checkbox.value, 10);
          } else {
            return checkbox.value;
          }
        });

    const addFilterListener = (filterClass, paramKey, type = "string") => {
      document
        .querySelector(`.${filterClass}`)
        .addEventListener("change", (event) => {
          if (event.target.matches(".filter-fieldset__checkbox")) {
            this.pageParams[paramKey] = getActiveCheckboxes(
              `.${filterClass} .filter-fieldset__checkbox`,
              type
            );
            this.savePageParams();
            this.loadProducts();
          }
        });
    };

    const filtersList = [
      { class: "filter-genre", key: "genre" },
      { class: "filter-platform", key: "platforms" },
      { class: "filter-year", key: "years", type: "number" },
      { class: "filter-multiplayer", key: "multiplayer" },
    ];

    filtersList.forEach((filter) =>
      addFilterListener(filter.class, filter.key, filter.type)
    );

    document
      .querySelector(".products-sort .select-product")
      .addEventListener("change", (event) => {
        this.pageParams.sortBy = event.target.value;
        this.savePageParams();
        this.loadProducts();
      });

    document
      .querySelector(".filter-price .min-price")
      .addEventListener("change", (event) => {
        const value = parseInt(event.target.value, 10);
        if (isNaN(value)) {
          this.pageParams.priceMin = 0;
        } else {
          this.pageParams.priceMin = value;
        }
        this.savePageParams();
        this.loadProducts();
      });

    document
      .querySelector(".filter-price .max-price")
      .addEventListener("change", (event) => {
        const value = parseInt(event.target.value, 10);
        if (isNaN(value) || value === 0) {
          this.pageParams.priceMax = parseInt(event.target.getAttribute("max"));
        } else {
          this.pageParams.priceMax = value;
        }

        this.savePageParams();
        this.loadProducts();
      });

    const sortOrderButtons = [
      ...document.querySelectorAll(".sort-order-button"),
    ];
    sortOrderButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const clickedButton = event.currentTarget;
        if (clickedButton.matches(".active")) return;
        sortOrderButtons.forEach((button) => button.classList.remove("active"));
        clickedButton.classList.add("active");
        this.pageParams.sortOrder =
          clickedButton.getAttribute("data-sort-order");
        this.savePageParams();
        this.loadProducts();
        console.log(clickedButton.getAttribute("data-sort-order"));
      });
    });

    document.querySelector(".clear-fitlers").addEventListener("click", () => {
      localStorage.removeItem("pageParams");
      this.pageParams = this.getPageParams();
      this.renderFilters().then(() => {
        this.loadProducts();
      });
    });
  }

  async loadProducts() {
    const urlParams = new URLSearchParams(this.pageParams).toString();
    console.log(`http://localhost:8000/load-products?${urlParams}`);
    const products = await (
      await fetch(`http://localhost:8000/load-products?${urlParams}`)
    ).json();
    const productsListBox = document.querySelector(".products__list-part");
    let productRow = ``;
    products.forEach((product) => {
      productRow += this.renderProductRow(product);
    });
    productsListBox.innerHTML = productRow;
    this.addEventToProductItemButton();
  }

  renderProductRow(product) {
    const ratingBackgorundWidth = 100 - product.rating * 20;
    const platfroms = product.platforms.join(",");
    return `<div class="product-item" data-id="${product.id}">
                    <div class="product-cover">
                      <img src="${product.gameCoverImage}" class="product-cover-image">
                      <div class="product-buttons">
                        <button class="product-button edit-product">
                          <img src="images/common/edit.svg">
                        </button>
                        <button class="product-button delete-product">
                          <img src="images/common/delete.svg">
                        </button>
                      </div>
                    </div>
                    <div class="rating">
                      <div class="stars">
                        <svg viewBox="0 0 576 512" width="100" title="star">
                          <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                        </svg><svg viewBox="0 0 576 512" width="100" title="star">
                          <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                        </svg><svg viewBox="0 0 576 512" width="100" title="star">
                          <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                        </svg><svg viewBox="0 0 576 512" width="100" title="star">
                          <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                        </svg><svg viewBox="0 0 576 512" width="100" title="star">
                          <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                        </svg>
                        <div class="cover" style="width: ${ratingBackgorundWidth}%;"></div>
                      </div>
                      <div class="rating-number"><span class="rating-number-value">${product.rating}</span></div>
                    </div>
                    <div class="product-info">
                      <h3 class="product-title">${product.title}</h3>
                      <p class="product-genre"><strong>Genre: </strong>${product.genre}</p>
                      <p class="product-platforms"><strong>Platforms: </strong>${platfroms}</p>
                      <p class="product-release-date"><strong>Release Date: </strong>${product.releaseDate}</p>
                      <p class="product-description">${product.description}</p>
                      <p class="product-price"><strong>Price: </strong>${product.price}$</p>
                    </div>
                </div>`;
  }

  addEventToProductItemButton() {
    document
      .querySelector(".products__list-part")
      .addEventListener("click", (event) => {
        if (event.target.closest(".edit-product")) {
          const currentProduct = event.target.closest(".product-item");
        } else if (event.target.closest(".delete-product")) {
          const currentProduct = event.target.closest(".product-item");
          this.deleteProduct(parseInt(currentProduct.dataset.id));
        }
      });
  }

  deleteProduct(id) {
    fetch(`http://localhost:8000/delete-product?id=${id}`, {
      method: "DELETE"
    });
    this.loadProducts()
  }

  initProductList() {
    this.renderFilters().then(() => {
      this.addEventsToFilters();
      this.loadProducts();
    });
  }
}

const productList = new ProductList();
productList.initProductList();
