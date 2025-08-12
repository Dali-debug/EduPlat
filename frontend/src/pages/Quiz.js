import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizService';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './Quiz.css';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  useEffect(() => {
    let timer;
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeLeft]);

  const loadQuiz = async () => {
    try {
      const response = await quizService.getQuiz(id);
      setQuiz(response.quiz);
      setTimeLeft(response.quiz.dureeMax * 60); // Convert minutes to seconds
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      toast.error('Impossible de charger le quiz');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    toast.success('Quiz commencé !');
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const goToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const goToNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;

    setSubmitting(true);
    
    try {
      // Préparer les réponses
      const formattedAnswers = quiz.questions.map((_, index) => answers[index] || '');
      const timeTaken = (quiz.dureeMax * 60) - timeLeft;

      const response = await quizService.submitQuiz(id, formattedAnswers, timeTaken);
      setResults(response.resultat);
      setQuizCompleted(true);
      toast.success('Quiz soumis avec succès !');
    } catch (error) {
      console.error('Erreur soumission quiz:', error);
      toast.error('Erreur lors de la soumission du quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).filter(key => answers[key] !== '').length;
  };

  const isQuestionAnswered = (questionIndex) => {
    return answers[questionIndex] && answers[questionIndex] !== '';
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du quiz..." />;
  }

  if (!quiz) {
    return (
      <div className="quiz-error">
        <h2>Quiz non trouvé</h2>
        <p>Le quiz que vous recherchez n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  // Quiz Results View
  if (quizCompleted && results) {
    return (
      <div className="quiz-results-page">
        <div className="container">
          <div className="results-header">
            <div className={`results-icon ${results.reussi ? 'success' : 'failure'}`}>
              {results.reussi ? <Award size={48} /> : <AlertCircle size={48} />}
            </div>
            <h1>{results.reussi ? 'Félicitations !' : 'Quiz non réussi'}</h1>
            <p>
              {results.reussi 
                ? 'Vous avez réussi ce quiz avec succès !'
                : 'Vous n\'avez pas atteint la note de passage.'
              }
            </p>
          </div>

          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-value">{results.score}</div>
              <div className="stat-label">Points obtenus</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.pourcentage}%</div>
              <div className="stat-label">Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{results.bonnesReponses}/{results.totalQuestions}</div>
              <div className="stat-label">Bonnes réponses</div>
            </div>
          </div>

          {results.corrections && (
            <div className="results-details">
              <h3>Détail des réponses</h3>
              <div className="corrections-list">
                {results.corrections.map((correction, index) => (
                  <div key={index} className={`correction-item ${correction.estCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="correction-header">
                      <span className="question-number">Question {index + 1}</span>
                      <span className={`correction-status ${correction.estCorrect ? 'correct' : 'incorrect'}`}>
                        {correction.estCorrect ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {correction.estCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <div className="correction-content">
                      <p><strong>Votre réponse :</strong> {correction.reponseUtilisateur}</p>
                      {correction.explication && (
                        <p className="explanation"><strong>Explication :</strong> {correction.explication}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-actions">
            <button 
              onClick={() => navigate('/courses')}
              className="btn btn-primary"
            >
              Retour aux cours
            </button>
            {!results.reussi && (
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-outline"
              >
                <RefreshCw size={16} />
                Recommencer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Start View
  if (!quizStarted) {
    return (
      <div className="quiz-start-page">
        <div className="container">
          <div className="quiz-intro">
            <h1>{quiz.titre}</h1>
            {quiz.description && <p className="quiz-description">{quiz.description}</p>}

            <div className="quiz-info">
              <div className="info-item">
                <Clock size={20} />
                <span>Durée : {quiz.dureeMax} minutes</span>
              </div>
              <div className="info-item">
                <CheckCircle size={20} />
                <span>Questions : {quiz.questions.length}</span>
              </div>
              <div className="info-item">
                <Award size={20} />
                <span>Points total : {quiz.pointsTotal}</span>
              </div>
              <div className="info-item">
                <AlertCircle size={20} />
                <span>Note de passage : {quiz.notePassage}%</span>
              </div>
            </div>

            <div className="quiz-instructions">
              <h3>Instructions</h3>
              <ul>
                <li>Vous avez {quiz.dureeMax} minutes pour compléter ce quiz</li>
                <li>Vous pouvez naviguer entre les questions</li>
                <li>Votre progression sera sauvegardée automatiquement</li>
                <li>Une fois soumis, vous ne pourrez plus modifier vos réponses</li>
                <li>Assurez-vous d'avoir une connexion internet stable</li>
              </ul>
            </div>

            <button onClick={startQuiz} className="btn btn-primary btn-lg">
              Commencer le quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  const currentQuestionData = quiz.questions[currentQuestion];

  return (
    <div className="quiz-taking-page">
      <div className="container">
        {/* Quiz Header */}
        <div className="quiz-header">
          <div className="quiz-title">
            <h1>{quiz.titre}</h1>
            <span className="question-counter">
              Question {currentQuestion + 1} sur {quiz.questions.length}
            </span>
          </div>

          <div className="quiz-timer">
            <Clock size={20} />
            <span className={timeLeft < 300 ? 'warning' : ''}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {getAnsweredQuestionsCount()} / {quiz.questions.length} répondues
          </span>
        </div>

        <div className="quiz-content">
          {/* Question */}
          <div className="question-section">
            <div className="question-header">
              <h2>Question {currentQuestion + 1}</h2>
              <span className="question-points">{currentQuestionData.points} point(s)</span>
            </div>
            
            <p className="question-text">{currentQuestionData.question}</p>

            {/* Answer Options */}
            <div className="answer-options">
              {currentQuestionData.type === 'choix_multiple' && (
                <div className="multiple-choice">
                  {currentQuestionData.options.map((option, index) => (
                    <label key={index} className="option-label">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={option.texte}
                        checked={answers[currentQuestion] === option.texte}
                        onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                      />
                      <span className="option-text">{option.texte}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestionData.type === 'vrai_faux' && (
                <div className="true-false">
                  {currentQuestionData.options.map((option, index) => (
                    <label key={index} className="option-label">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={option.texte}
                        checked={answers[currentQuestion] === option.texte}
                        onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                      />
                      <span className="option-text">{option.texte}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestionData.type === 'texte_libre' && (
                <div className="text-input">
                  <textarea
                    value={answers[currentQuestion] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                    placeholder="Tapez votre réponse ici..."
                    rows={4}
                    className="answer-textarea"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Question Navigation */}
          <div className="question-navigation">
            <div className="nav-buttons">
              <button 
                onClick={goToPreviousQuestion}
                disabled={currentQuestion === 0}
                className="btn btn-outline"
              >
                <ArrowLeft size={16} />
                Précédent
              </button>

              {currentQuestion === quiz.questions.length - 1 ? (
                <button 
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      Soumission...
                    </>
                  ) : (
                    'Soumettre le quiz'
                  )}
                </button>
              ) : (
                <button 
                  onClick={goToNextQuestion}
                  className="btn btn-primary"
                >
                  Suivant
                  <ArrowRight size={16} />
                </button>
              )}
            </div>

            {/* Question Grid */}
            <div className="questions-grid">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`question-button ${
                    index === currentQuestion ? 'current' : ''
                  } ${isQuestionAnswered(index) ? 'answered' : ''}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;