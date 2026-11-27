import "./MegaMenu.css";

function MegaMenu({ isOpen }) {
    return (
        <div className={`mega-menu ${isOpen ? "active" : ""}`}>
            <div className="mega-column">

                <h4>Property Management</h4>

                <a href="#">Dashboard</a>
                <a href="#">Reservations</a>
                <a href="#">Housekeeping</a>
                <a href="#">Guests</a>

            </div>

            <div className="mega-column">

                <h4>Distribution</h4>

                <a href="#">Airbnb</a>
                <a href="#">Booking.com</a>
                <a href="#">Agoda</a>
                <a href="#">Channel Manager</a>

            </div>

            <div className="mega-column">

                <h4>Revenue</h4>

                <a href="#">Payments</a>
                <a href="#">Reports</a>
                <a href="#">Analytics</a>
                <a href="#">Direct Bookings</a>

            </div>
        </div>
    );
}

export default MegaMenu;