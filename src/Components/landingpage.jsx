import React from 'react';
import { useUser } from './UserContext';
import { Link } from 'react-router-dom';
import '../Style/landingpage.css';
import Navbar from "./NavBar";

function LandingPage() {
    const { user } = useUser();

    return (
        <>
            <Navbar/>
            <div className="landing-page">
                <section className="hero">
                    <div className="hero-content">
                        <img src="/images/photo-1568602471122-7832951cc4c5.jpg" alt="Books" className="hero-image"/>
                        <h1>Create, Edit, and Manage Your Books with Ease</h1>
                        <p>Our book editor app provides an intuitive and user-friendly interface for creating, editing, and managing your books. Whether you're a seasoned author or just starting out, our app has everything you need to bring your ideas to life.</p>
                        {user && (
                            <Link to="/books" className="button">
                                Go to My Books
                            </Link>
                        )} {!user && (
                            <>
                                <Link to="/register" className="button">
                                    Sign Up
                                </Link>
                                <Link to="/login" className="button">
                                    Log In
                                </Link>
                            </>
                        )}
                    </div>
                </section>
                <section className="features">
                    <div className="feature-item">
                        <img src="/images/photo-1581090700227-1e37b190418e.jpg" alt="Book" className="feature-image"/>
                        <h2>Intuitive Interface</h2>
                        <p>Our app provides an intuitive and user-friendly interface that makes it easy to create and edit your books. Whether you're adding new chapters, editing existing content, or formatting your text, our app has everything you need to get the job done.</p>
                    </div>
                    <div className="feature-item">
                        <img src="/images/photo-1524995997946-a1c2e315a42f.jpg" alt="Collaboration"
                             className="feature-image"/>
                        <h2>Collaboration Tools</h2>
                        <p>Our app provides collaboration tools that make it easy to work with others on your books. Whether you're working with a co-author, an editor, or a proofreader, our app makes it easy to share your work and collaborate in real-time.</p>
                    </div>
                    <div className="feature-item">
                        <img src="/images/istockphoto-585488832-1024x1024.jpg" alt="Advanced Features"
                             className="feature-image"/>
                        <h2>Advanced Features</h2>
                        <p>Our app provides advanced features that help you take your books to the next level. Whether you're adding images, tables, or other multimedia content, our app has everything you need to create professional-looking books that stand out from the crowd.</p>
                    </div>
                </section>
                <section className="testimonials">
                    <h2>What Our Users Are Saying</h2>
                    <div className="testimonial-item">
                        <p>"I love using this app to write my books. It's so easy to use and has all the features I need."</p>
                        <span>- Jane Doe</span>
                    </div>
                    <div className="testimonial-item">
                        <p>"This app has made it so much easier to collaborate with my co-author on our book."</p>
                        <span>- John Smith</span>
                    </div>
                    <div className="testimonial-item">
                        <p>"I'm impressed with the advanced features this app provides. It's helped me create professional-looking books that I'm proud to share with others."</p>
                        <span>- Sarah Lee</span>
                    </div>
                </section>
            </div>
        </>
    );
}

export default LandingPage;