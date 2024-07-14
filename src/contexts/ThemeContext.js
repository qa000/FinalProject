// // src/contexts/ThemeContext.js
// import React, { createContext, useState, useContext, useEffect } from 'react';

// const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTheme] = useState('light');

//   // 애플리케이션이 로드될 때 로컬 스토리지에서 테마를 불러옴
//   useEffect(() => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) {
//       setTheme(savedTheme);
//     }
//   }, []);

//   const toggleTheme = () => {
//     setTheme((prevTheme) => {
//       const newTheme = prevTheme === 'light' ? 'dark' : 'light';
//       localStorage.setItem('theme', newTheme); // 로컬 스토리지에 테마 저장
//       return newTheme;
//     });
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = () => useContext(ThemeContext);


// ThemeContext.js
// import React, { createContext, useContext, useState } from 'react';
// import { createGlobalStyle, ThemeProvider as StyledThemeProvider } from 'styled-components';

// const ThemeContext = createContext();

// const GlobalStyle = createGlobalStyle`
//   body {
//     background-color: ${({ theme }) => (theme === 'light' ? '#f8f8f8' : '#333')};
//     color: ${({ theme }) => (theme === 'light' ? '#000' : '#fff')};
//     transition: background-color 0.3s ease, color 0.3s ease;
//   }
// `;

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTheme] = useState('light');

//   const toggleTheme = () => {
//     setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       <StyledThemeProvider theme={{ mode: theme }}>
//         <GlobalStyle theme={theme} />
//         {children}
//       </StyledThemeProvider>
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = () => {
//   return useContext(ThemeContext);
// };


// ThemeContext.js
import React, { createContext, useContext, useState } from 'react';
import { createGlobalStyle, ThemeProvider as StyledThemeProvider } from 'styled-components';

const ThemeContext = createContext();

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ theme }) => (theme === 'light' ? '#f8f8f8' : '#333')};
    color: ${({ theme }) => (theme === 'light' ? '#000' : '#fff')};
    transition: background-color 0.3s ease, color 0.3s ease;
  }
`;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <StyledThemeProvider theme={{ mode: theme }}>
        <GlobalStyle theme={theme} />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
