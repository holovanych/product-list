class ProductsServices {
  constructor() {
    this.filters = this.getFilters();
  }

  async getFilters(){
    return await (await fetch('http://localhost:8000/product-filters')).json()
  }
}

export default ProductsServices;