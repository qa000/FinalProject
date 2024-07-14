// src/components/AnimatedSection.jsx
import React from 'react';
import './Book.css'; // Book.css 파일 import

const AnimatedSection = ({ id, title, content, bgColor, color }) => {
  return (
    <section id={id} className="section" style={{ '--bgColor': bgColor, '--color': color }}>
      <h2 className="section-title">{title}</h2>
    </section>
  );
};

export default AnimatedSection;
