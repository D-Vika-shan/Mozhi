// Tutorial.js
import React from 'react';
import './Tutorial.css'; // Import the CSS file for styles

const Tutorial = ({ onBack }) => {
  return (
    <div className="tutorial-container">
      <button onClick={onBack} className="back-button">Back</button>
      <h2>Tutorial Video</h2>
      <div className="iframe-container">
        <iframe
          title="Tutorial Video"
          width="560"
          height="315"
          src="https://drive.google.com/file/d/12lWqIMRmBWKQdZmOMIQg66FxfOf-7aSq/preview" 
          // Replace with your Google Drive video link
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default Tutorial;
