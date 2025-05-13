// App.jsx
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import "./App.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import CheckAvailability from "./CheckAvailability";
import logo from "./assets/margies logo.jpg";
import mainapartmentimg2 from "./assets/mainapartmentimg2.jpg";
import room1img2 from "./assets/room1img2.jpg";
import mainapartmentimg3 from "./assets/mainapartmentimg3.jpg";

// You might want a simple component to display room details or gallery
// For now, let's just console log or navigate
const handleCarouselClick = (index, item) => {
  console.log("Carousel image clicked:", index, item.props.alt);
  // TODO: Implement navigation or state update to show more images
  // Example: navigate('/room-gallery', { state: { room: item.props.alt } });
  alert(`You clicked on: ${item.props.alt}. We'll show you more images soon!`);
};

// WhatsApp Float Component (added at the bottom of the file)
const WhatsAppFloat = () => {
  const phoneNumber = '+2348035350455';
  const defaultMessage = 'I will like to get information about Margies.';
  
  const whatsappUrl = 'https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}';

  return (
    <a 
      href={whatsappUrl} 
      className="whatsapp-float"
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp className="whatsapp-icon" />
    </a>
  );
};

function App() {
  // State for the contact form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState(""); // To show feedback to user

  const handleCheckAvailability = (data) => {
    console.log("Customer selected availability dates:", data);
    // This data { checkInDate, checkOutDate } will be passed to CheckAvailability component
    // The actual availability check logic will likely live inside CheckAvailability or a service
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsAdmin(true); // Stay in admin mode if logged in
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false); // Exit admin mode on logout
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setContactStatus("Sending message...");

    try {
      await addDoc(collection(db, "messages"), {
        name: contactName,
        email: contactEmail,
        message: contactMessage,
        created: Timestamp.now()
      });
      setContactStatus("Message sent successfully!");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      setContactStatus("Error sending message.");
      console.error(err);
    }
  };

  // Carousel items - add an identifier for linking later
  const carouselItems = [
    { src: mainapartmentimg3, alt: "Main Apartment Kitchen", caption: "Main Apartment Kitchen", roomKey: "apartment" },
    { src: mainapartmentimg2, alt: "Main Apartment Bedroom", caption: "Main Apartment Bedroom", roomKey: "apartment" },
    { src: room1img2, alt: "Room 2 Bedroom", caption: "Room 2 Bedroom", roomKey: "room2" }, // Using roomKey to identify context
    // Add more images/items here as needed
  ];


  return (
    <div className="App">
      <header className="header">
        {/* Use a div for logo and name to keep them together for flexbox */}
        <div className="brand-container">
          {/* Ensure the logo path is correct based on your project structure */}
          <img src={logo} alt="margies logo" className="logo" />
          <span className="brand-name"> </span>
        </div>

        <nav>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#check">Book Now</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact Us</a></li>
             {/* Admin link only shown when not in admin mode */}
             {!isAdmin && (
              <li><button onClick={() => setIsAdmin(true)} className="admin-button-link">Admin Login</button></li>
            )}
             {/* Logout link only shown when in admin mode and logged in */}
             {isAdmin && isLoggedIn && (
              <li><button onClick={handleLogout} className="admin-button-link">Logout</button></li>
            )}
          </ul>
        </nav>
      </header>

      {/* Conditional rendering based on isAdmin and isLoggedIn */}
      {isAdmin ? (
        isLoggedIn ? (
          <AdminDashboard />
        ) : (
          <AdminLogin onLogin={handleLogin} />
        )
      ) : (
        <main>
          <section id="home">
            <Carousel
              autoPlay
              infiniteLoop
              showThumbs={false}
              showStatus={false}
              interval={4000}
              onClickItem={handleCarouselClick} // Make items clickable
            >
              {carouselItems.map((item, index) => (
                <div key={index} className="carousel-slide">
                  {/* Adding a class or identifier might be helpful for handling clicks */}
                  <img src={item.src} alt={item.alt} className="carouselmedia" />
                  {/* Keep the legend if you like */}
                  <p className="legend">{item.caption}</p>
                </div>
              ))}
            </Carousel>
          </section>

          <section id="check" className="section">
            <h2>Check Room Availability</h2>
            {/* We'll make CheckAvailability fully interactive in its own file */}
            <CheckAvailability onCheck={handleCheckAvailability} />
          </section>

          <section id="about" className="section">
  <h2>Discover Margies</h2>
  <p>
    Nestled in the vibrant heart of Lagos Mainland at <strong>43, Oguntona Crescent, Gbagada Phase 1</strong>, 
    Margies is more than just accommodation - it's a cultural experience. Perched above a bustling indigenous 
    restaurant and opposite a well-stocked supermarket, our location pulses with the authentic rhythm of Lagos life.
  </p>
  
  <p>
    By day, explore our neighborhood's rich tapestry of commerce and culture. By night, step right into Gbagada's 
    legendary nightlife, with our building standing just moments away from the sizzling Suya grill spot where 
    Lagosians from all walks of life converge under the stars.
  </p>

  <p>
    Whether you're here for business or pleasure, Margies offers the perfect blend of convenience and local flavor. 
    Need anything? Reach us at <strong>+234 803 535 0455</strong>, use our <strong>Contact Us</strong> form, 
    or tap the WhatsApp icon for instant assistance. We're not just your hosts - we're your gateway to authentic 
    Lagos living.
  </p>

  <p>
    At Margies, you don't visit Lagos - you <em>live</em> it. Wake up to the aroma of local delicacies wafting 
    from below, stroll to the supermarket across the street for essentials, and end your day sharing stories over 
    Suya with fellow guests and locals alike. This isn't just a stay - it's your Lagos story waiting to happen.
  </p>
</section>

          <section id="contact" className="section">
            <h2>Contact Us</h2>
            <form className="contact-form" onSubmit={handleSubmitContact}>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              <textarea
                name="message"
                placeholder="Your Message"
                rows="5"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              ></textarea>
              <button type="submit">Send Message</button>
            </form>
            {contactStatus && <p>{contactStatus}</p>} {/* Display status message */}
          </section>
          <div className="whatsapp-float">
            {/* WhatsAppFloat component for quick contact */}
          < WhatsAppFloat/>
           <style>{`
        .whatsapp-float {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background-color: #25D366;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          transition: all 0.3s ease;
          animation: pulse 2s infinite;
        }
        .whatsapp-float:hover {
          background-color: #128C7E;
          transform: scale(1.1);
        }
        .whatsapp-icon {
          font-size: 32px;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
      `}</style>
          </div>
        </main>
      )}

      <footer className="footer">
        <p>&copy; 2025 Margie's. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
