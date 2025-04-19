'use client';
import React, { useState } from "react";

const projects = [
  {
    title: {
      en: "Weather App",
      pt: "Aplicativo de Clima",
    },
    description: {
      en: "A simple weather forecast app.",
      pt: "Um aplicativo simples de previsão do tempo.",
    },
    link: "https://youtube.com"
  },
  {
    title: {
      en: "Task Manager",
      pt: "Gerenciador de Tarefas",
    },
    description: {
      en: "Manage your daily tasks.",
      pt: "Gerencie suas tarefas diárias.",
    },
    link: "https://google.com"
  },
];

const Home: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'pt'>('pt');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'pt' : 'en'));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col">
      <div className="min-w-2xl mx-auto flex-grow"> 
        <h1 className="text-4xl font-bold mb-6 text-center"> 
          {language === 'en' ? 'My Projects' : 'Meus Projetos'}
        </h1>
        <div className="flex flex-col gap-6"> 
          {projects.map((project, index) => (
            <div key={index} 
              className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" 
              onClick={() => window.open(project.link, "_blank")}>
              <h2 className="text-2xl font-semibold mb-2">{project.title[language]}</h2>
              <p className="text-gray-300">{project.description[language]}</p>
            </div>
          ))}
        </div>
      </div>
      <footer className="flex justify-end mt-6">
        <button onClick={toggleLanguage} className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded">
          {language === 'en' ? 'Português' : 'English'}
        </button>
      </footer>
    </div>
  );
};

export default Home;
