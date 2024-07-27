import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { FaMicrophone, FaStop, FaVolumeUp } from 'react-icons/fa';
import './App.css'; // Import the CSS file
import logo from './logo.png';
import bleepSound from './bleep.mp3'; // Import a bleep sound file

const App = () => {
  const [translatedText1, setTranslatedText1] = useState('');
  const [translatedText2, setTranslatedText2] = useState('');
  const [transcript1, setTranscript1] = useState('');
  const [transcript2, setTranscript2] = useState('');
  const [isListening1, setIsListening1] = useState(false);
  const [isListening2, setIsListening2] = useState(false);
  const [error, setError] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [gender1, setGender1] = useState('male'); // New state for gender
  const [gender2, setGender2] = useState('male'); // New state for gender
  const [isNamesSet, setIsNamesSet] = useState(false);
  const badWordsTamil = ['வீய்ம்', 'அருயான்']; // Example Tamil bad words

  const recognitionRef1 = useRef(null);
  const recognitionRef2 = useRef(null);
  const timeoutRef1 = useRef(null);
  const timeoutRef2 = useRef(null);
  const bleepRef = useRef(new Audio(bleepSound)); // Reference to bleep sound

  const key = "0ea59df1599546fb9ab706c3b333f91d";
  const endpoint = "https://api.cognitive.microsofttranslator.com/translate";
  const location = "centralindia";

  const stopListening = useCallback((recognitionRef, setIsListening, timeoutRef) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const resetNoSpeechTimeout = (timeoutRef, isListening, stopListening) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 10000); // 10 seconds timeout
    };

    const initializeRecognition = (recognitionRef, setTranscript, resetNoSpeechTimeout, stopListening, timeoutRef, setIsListening) => {
      if ('webkitSpeechRecognition' in window) {
        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setTranscript(transcript);
          resetNoSpeechTimeout(timeoutRef, true, () => stopListening(recognitionRef, setIsListening, timeoutRef));
        };

        recognitionRef.current.onerror = (event) => {
          if (event.error === 'no-speech') {
            setError('No speech detected. Please try again.');
            stopListening(recognitionRef, setIsListening, timeoutRef);
          } else {
            console.error('Speech recognition error', event.error);
            setError(`Speech recognition error: ${event.error}`); // Fixed string interpolation
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        console.log('Speech recognition not supported');
        setError('Speech recognition is not supported in your browser.');
      }
    };

    initializeRecognition(recognitionRef1, setTranscript1, resetNoSpeechTimeout, stopListening, timeoutRef1, setIsListening1);
    initializeRecognition(recognitionRef2, setTranscript2, resetNoSpeechTimeout, stopListening, timeoutRef2, setIsListening2);

    return () => {
      stopListening(recognitionRef1, setIsListening1, timeoutRef1);
      stopListening(recognitionRef2, setIsListening2, timeoutRef2);
    };
  }, [stopListening]);

  const moderateContent = async (text, language) => {
    let moderatedText = text;
    if (language === 'ta') {
      badWordsTamil.forEach(word => {
        const regex = new RegExp(word, 'gi');
        moderatedText = moderatedText.replace(regex, '*');
      });
    }
    return moderatedText;
  };

  const translateText = useCallback(async (text, fromLang, toLang, setTranslatedText) => {
    try {
      const moderatedText = fromLang === 'ta' ? await moderateContent(text, 'ta') : text;
      const response = await axios({
        baseURL: endpoint,
        method: 'post',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Ocp-Apim-Subscription-Region': location,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        },
        params: {
          'api-version': '3.0',
          'from': fromLang,
          'to': toLang
        },
        data: [{
          'text': moderatedText
        }],
        responseType: 'json'
      });

      if (response.data && response.data[0] && response.data[0].translations && response.data[0].translations[0]) {
        const translatedText = response.data[0].translations[0].text;
        const moderatedTranslatedText = fromLang === 'ta' ? await moderateContent(translatedText, 'ta') : translatedText;
        setTranslatedText(moderatedTranslatedText);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation error. Please try again.');
    }
  }, [key, location, endpoint]);

  useEffect(() => {
    if (transcript1) {
      translateText(transcript1, 'ta', 'en', setTranslatedText2);
    }
  }, [transcript1, translateText]);

  useEffect(() => {
    if (transcript2) {
      translateText(transcript2, 'en', 'ta', setTranslatedText1);
    }
  }, [transcript2, translateText]);

  const startListening = useCallback((recognitionRef, setTranscript, setTranslatedText, setError, setIsListening, language) => {
    setTranscript('');
    setTranslatedText('');
    setError('');
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const speakText = (text, language) => {
    const splitPattern = /\+\s/;
    const parts = text.split(splitPattern);

    const startSpeech = (textPart, callback) => {
      const utterance = new SpeechSynthesisUtterance(textPart);
      utterance.lang = language;
      utterance.onend = callback;
      window.speechSynthesis.speak(utterance);
    };

    const playBleepAndSpeak = (index) => {
      if (index >= parts.length) return;

      startSpeech(parts[index], () => {
        if (index < parts.length - 1) {
          bleepRef.current.play().then(() => {
            playBleepAndSpeak(index + 1);
          }).catch(error => {
            console.error('Error playing bleep sound:', error);
            playBleepAndSpeak(index + 1); // Fallback to next part if bleep sound fails
          });
        }
      });
    };

    playBleepAndSpeak(0);
  };

  const handleNamesSubmit = (e) => {
    e.preventDefault();
    if (name1 && name2) {
      setIsNamesSet(true);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <img src={logo} alt="Mozhi Logo" className="logo" />
        <div className="app-name">Mozhi</div>
      </div>

      {!isNamesSet ? (
        <form onSubmit={handleNamesSubmit} className="name-form">
          <h2>Your 1-stop solution to your language barrier!!!</h2>
          <label className='names'>
            Name of Person 1 (Tamil):
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              required
            />
          </label>
          <label className=''>
            Name of Person 2 (English):
            <input
              type="text"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              required
            />
          </label>
          <button type="submit">Start Conversation</button>
        </form>
      ) : (
        <div className="translator-container">
          <div className={`person-container ${isListening1 ? 'listening' : 'speaking'}`}>
            <h2>{name1} (Tamil)</h2>
            <p>{transcript2 && <strong>{name2} says:</strong>} {translatedText1}</p>
            <button
              onClick={() => speakText(translatedText1, 'ta-IN')}
              disabled={!translatedText1}
              className="volume-button"
            >
              <FaVolumeUp />
            </button>
            <button
              onClick={() => startListening(recognitionRef1, setTranscript1, setTranslatedText1, setError, setIsListening1, 'ta-IN')}
              disabled={isListening1}
              className="start-button"
            >
              <FaMicrophone /> Start Speaking
            </button>
            <button
              onClick={() => stopListening(recognitionRef1, setIsListening1, timeoutRef1)}
              disabled={!isListening1}
              className="stop-button"
            >
              <FaStop /> Stop Speaking
            </button>
            <p><strong>Original:</strong> {transcript1}</p>
            <p>
              <strong>Translation for {name2}:</strong> {translatedText2}
            </p>
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className={`person-container ${isListening2 ? 'listening' : 'speaking'}`}>
            <h2>{name2} (English)</h2>
            <p>{transcript1 && <strong>{name1} says:</strong>} {translatedText2}</p>
            <button
              onClick={() => speakText(translatedText2, 'en-US')}
              disabled={!translatedText2}
              className="volume-button"
            >
              <FaVolumeUp />
            </button>
            <button
              onClick={() => startListening(recognitionRef2, setTranscript2, setTranslatedText2, setError, setIsListening2, 'en-US')}
              disabled={isListening2}
              className="start-button"
            >
              <FaMicrophone /> Start Speaking
            </button>
            <button
              onClick={() => stopListening(recognitionRef2, setIsListening2, timeoutRef2)}
              disabled={!isListening2}
              className="stop-button"
            >
              <FaStop /> Stop Speaking
            </button>
            <p><strong>Original:</strong> {transcript2}</p>
            <p>
              <strong>Translation for {name1}:</strong> {translatedText1}
            </p>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
