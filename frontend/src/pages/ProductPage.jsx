import { useParams, Link } from "react-router-dom";
import products from "../data/products.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/ProductPage.css";

export default function ProductPage() {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id));

  if (!product) return (
    <>
      <Header />
      <div className="container">
        <h2 style={{margin: '40px 0', textAlign: 'center'}}>Товар не найден</h2>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />

      <main className="container product-page">
        <section className="product-media">
          <div className="product-gallery">
            <img src={product.image} className="product-big-img" alt={product.title} />
          </div>
          <div className="product-thumbs">
            <img src={product.image} alt={product.title} />
            <img src={product.image} alt={product.title} />
            <img src={product.image} alt={product.title} />
          </div>
        </section>

        <aside className="product-info">
          <h1 className="product-title">{product.title}</h1>
          <p className="price-big">{product.price} ₽</p>

          <p className="desc">{product.description ?? "Описание товара отсутствует."}</p>

          <div className="actions">
            <button className="btn-primary">Написать продавцу</button>
            <button className="btn-primary outline">Добавить в избранное</button>
          </div>

          <div className="seller-card">
            <div className="seller-avatar">П</div>
            <div>
              <div className="seller-name">Продавец: студент</div>
              <div className="seller-meta">проживает в корпусе 8.1</div>
            </div>
          </div>

          <Link to="/" className="back-link">← Вернуться к каталогу</Link>
        </aside>
      </main>

      <Footer />
    </>
  );
}
