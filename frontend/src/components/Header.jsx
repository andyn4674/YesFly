import { Link } from 'react-router-dom';
import '../styles/components/Header.css';

function Header () {
    return (
        <>
            <div className="logo">YESFLY</div>
            <nav className="navigation-menu">
                <ul className="nav-links">
                    <li><Link to="/home">Home</Link></li>
                    <li><Link to="/supported-areas">Supported Areas</Link></li>
                    <li><Link to="/check-restrictions">Check Restrictions</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                </ul>
            </nav>
        </>
    );
}

export default Header;
