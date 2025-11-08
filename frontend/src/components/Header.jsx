import "../styles/Header.css";
import logo from "../assets/logo.png";
import profile from "../assets/profile_icon.png";

export default function Header() {
  return (
    <>
      <header className="header">
        <div className="container header-wrap">

          <button className="btn-primary sell-btn">+ Продать</button>

          <a href="/"><img src={logo} className="logo" alt="Logo" /></a>

            <img src={profile} className="profile-icon" />
        </div>
      </header>

      <button className="btn-primary sell-mobile">+ Продать</button>
    </>
  );
}
