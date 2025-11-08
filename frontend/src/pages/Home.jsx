import products from "../data/products.json";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import "../styles/Home.css";

export default function Home() {
  return (
    <>
      <Header />
      <Hero></Hero>
      <div className="container">
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              image={product.image}
            />
          ))}
        </div>
      </div>
      <button className="btn-primary load-btn">Загрузить ещё</button>
      <Footer></Footer>
    </>
  );
}
