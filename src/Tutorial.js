
import React from 'react';
import './Tutorial.css';

const Tutorial = ({ onBack, language, getTranslation }) => {
  return (
    <div className="tutorial-container">
      <button onClick={onBack} className="back-button">{getTranslation('back')}</button>
      <h2>{getTranslation('tutorial')}</h2>
      <div className="iframe-container">
        <iframe
          title="Tutorial Video"
          width="560"
          height="315"
          src="https://drive.google.com/file/d/12lWqIMRmBWKQdZmOMIQg66FxfOf-7aSq/preview" 
   
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default Tutorial;
