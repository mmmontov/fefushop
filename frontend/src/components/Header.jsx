import "../styles/Header.css";
import logo from "../assets/logo.png";
import profile from "../assets/profile_icon.png";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <>
      <header className="header">
        <div className="container header-wrap">

          <button className="btn-primary sell-btn">+ Продать</button>

          <a href="/"><img src={logo} className="logo" alt="Logo" /></a>

          <Link to="/profile">
            <img src={profile} className="profile-icon" alt="Профиль" />
          </Link>
        </div>
      </header>

      <button className="btn-primary sell-mobile">+ Продать</button>
    </>
  );
}
