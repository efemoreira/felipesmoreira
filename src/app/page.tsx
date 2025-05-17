'use client';
import React, { useState } from "react";
import Image from 'next/image';

const profileInfo = {
  name: {
    en: "Felipe Moreira",
    pt: "Felipe Moreira"
  },
  title: {
    en: "About Me",
    pt: "Sobre Mim"
  },
  description: {
    en: "Welcome to my personal page. Here you can find information about me and my work.",
    pt: "Bem-vindo à minha página pessoal. Aqui você pode encontrar informações sobre mim e meu trabalho."
  },
  contact: {
    phone: "85997223863",
    email: "contato@felipesmoreira.com",
    social: [
      {
        name: "Instagram (Pessoal)",
        username: "efemoreira",
        url: "https://instagram.com/efemoreira"
      },
      {
        name: "Instagram (Político)",
        username: "moreiramissao",
        url: "https://instagram.com/moreiramissao"
      }
    ]
  }
};

const Home: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'pt'>('pt');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'pt' : 'en'));
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col">
      <div className="max-w-3xl mx-auto flex-grow w-full"> 
        <header className="flex justify-end mb-6">
          <button onClick={toggleLanguage} className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded">
            {language === 'en' ? 'Português' : 'English'}
          </button>
        </header>

        <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
          <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
            <Image 
              src="/image/me.png" 
              alt="Felipe Moreira" 
              width={192}
              height={192}
              className="object-cover"
            />
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">{profileInfo.name[language]}</h1>
            <h2 className="text-2xl font-semibold mb-4">{profileInfo.title[language]}</h2>
            <p className="text-gray-300">{profileInfo.description[language]}</p>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {language === 'en' ? 'Contact' : 'Contato'}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{profileInfo.contact.phone}</span>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{profileInfo.contact.email}</span>
            </div>
            
            {profileInfo.contact.social.map((social, index) => (
              <div key={index} className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4.485 4.485a4 4 0 105.656 5.656l1.102-1.101" />
                </svg>
                <a 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors duration-300"
                >
                  {social.name}: @{social.username}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="mt-auto pt-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Felipe Moreira</p>
      </footer>
    </div>
  );
};

export default Home;
