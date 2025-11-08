import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductPage />} />
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
