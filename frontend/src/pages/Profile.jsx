import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import products from "../data/products.json";
import "../styles/Profile.css";

export default function Profile() {
	// Пример данных пользователя. Если у вас есть бекенд, замените на реальный запрос.
	const user = {
		name: "Иван Иванов",
		faculty: "Факультет информационных технологий",
		course: "2 курс",
		dorm: "Общежитие 3",
		rating: 4.6,
	};

	// В product.json нет поля владельца, поэтому для демонстрации выберем несколько объявлений.
	// При подключении реального API замените фильтрацию на проверку ownerId или sellerId.
	const userProductIds = [1, 3, 6, 8];
	const userProducts = products.filter((p) => userProductIds.includes(p.id));

	const initials = user.name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("");

	const stars = [];
	const full = Math.floor(user.rating);
	const half = user.rating - full >= 0.5;
	for (let i = 0; i < full; i++) stars.push("full");
	if (half) stars.push("half");
	while (stars.length < 5) stars.push("empty");

	return (
		<>
			<Header />

			<main className="container profile-page">
				<aside className="profile-panel">
					<div className="profile-card">
						<div className="profile-avatar">{initials}</div>

						<h2 className="profile-name">{user.name}</h2>

						<div className="profile-meta">
							<div>{user.faculty}</div>
							<div className="muted">{user.course}</div>
						</div>

						<div className="profile-dorm">
							<strong>Проживание:</strong>
							<div className="muted">{user.dorm}</div>
						</div>

						<div className="profile-rating">
							<div className="rating-label">Рейтинг</div>
							<div className="rating-stars">
								{stars.map((s, i) => (
									<span key={i} className={`star ${s}`}>
										{s === "full" ? "★" : s === "half" ? "☆" : "☆"}
									</span>
								))}
								<span className="rating-value">{user.rating.toFixed(1)}</span>
							</div>
						</div>
					</div>
				</aside>

				<section className="profile-listings">
					<h3 className="section-title">Объявления пользователя</h3>

					{userProducts.length === 0 ? (
						<p className="muted">У пользователя пока нет объявлений.</p>
					) : (
						<div className="products-grid">
							{userProducts.map((p) => (
								<ProductCard
									key={p.id}
									id={p.id}
									title={p.title}
									price={p.price}
									image={p.image}
								/>
							))}
						</div>
					)}
				</section>
			</main>

			<Footer />
		</>
	);
}
