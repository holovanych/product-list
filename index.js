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

    if(isNaN(this.pageParams.priceMax) || this.pageParams.priceMax === 0) {
      this.pageParams.priceMax = filters.maxPrice;
      maxPriceInput.value = "";
    } else {
      maxPriceInput.value = this.pageParams.priceMax;
    }
    
    minPriceInput.value = this.pageParams.priceMin || "";

    /* Sort By */
    document.querySelector(".products-sort .select-product").value =
      this.pageParams.sortBy;
    console.log(this.pageParams);
  }

  getPageParams() {
    if (!localStorage.pageParams) {
      return {
        sortBy: "releaseDate",
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
        if(isNaN(value)) {
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
        console.log(value, isNaN(value))
        if(isNaN(value) || value === 0) {
          this.pageParams.priceMax = parseInt(event.target.getAttribute('max'));
        } else {
          this.pageParams.priceMax = value;
        }
        
        this.savePageParams();
        this.loadProducts();
      });

    document.querySelector(".clear-fitlers").addEventListener("click", () => {
      localStorage.removeItem("pageParams");
      this.pageParams = this.getPageParams();
      this.renderFilters().then(()=>{
        this.loadProducts();
      });
      
    });
  }

  async loadProducts(){
    const urlParams = new URLSearchParams(this.pageParams).toString();
    const products = await (await fetch(`http://localhost:8000/load-products?${urlParams}`)).json();
    const productsListBox = document.querySelector(".products__list-part");
    let productRow = ``;
    products.forEach((product) => {
      productRow += `<img src="${product.gameCoverImage}">`;
    });
    productsListBox.innerHTML = productRow;
    console.log(products)
  }

  initProductList() {
    this.renderFilters().then(()=>{
      this.addEventsToFilters();
      this.loadProducts();
    });
  }
}

const productList = new ProductList();
productList.initProductList();
