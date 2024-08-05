class ProductsServices {
  constructor() {
    this.filters = this.getFilters();
  }

  async getFilters(){
    return await (await fetch('http://localhost:8000/product-filters')).json()
  }

  async getProductByID(id){
    return await (await fetch(`http://localhost:8000/product-by-id?id=${id}`)).json()
  }
}

export default ProductsServices;