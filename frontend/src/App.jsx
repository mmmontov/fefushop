import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}


// function App() {
//   return (
//     <>
//       <Header />
//       <Hero />
//       <Products />
//       <Footer />
//     </>
//   );
// }

export default App;
